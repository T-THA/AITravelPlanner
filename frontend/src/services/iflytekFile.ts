/**
 * 科大讯飞语音识别服务 - HTTP兼容版本
 * 支持文件上传方式,不依赖getUserMedia
 */

import CryptoJS from 'crypto-js';

export interface RecognitionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface RecognitionError {
  code: number;
  message: string;
}

interface IFlyTekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

class IFlyTekFileASRService {
  private config: IFlyTekConfig;
  private websocket: WebSocket | null = null;

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_IFLYTEK_APP_ID,
      apiKey: import.meta.env.VITE_IFLYTEK_API_KEY,
      apiSecret: import.meta.env.VITE_IFLYTEK_API_SECRET,
    };
  }

  /**
   * 生成 WebSocket 鉴权 URL
   */
  private generateAuthUrl(): string {
    const url = 'wss://iat-api.xfyun.cn/v2/iat';
    const host = 'iat-api.xfyun.cn';
    const date = new Date().toUTCString();
    const algorithm = 'hmac-sha256';
    const headers = 'host date request-line';

    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);

    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    return `${url}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  }

  /**
   * 将音频文件转换为PCM格式
   */
  private async convertAudioToPCM(audioFile: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // 创建离线音频上下文
          const audioContext = new OfflineAudioContext(1, 16000 * 60, 16000); // 1通道, 最长60秒
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // 重采样到16kHz单声道
          const pcmData = audioBuffer.getChannelData(0);
          
          // 转换为16bit PCM
          const pcm16 = new Int16Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            const s = Math.max(-1, Math.min(1, pcmData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          
          resolve(pcm16.buffer);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(audioFile);
    });
  }

  /**
   * ArrayBuffer转Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < binary.length; i++) {
      binaryString += String.fromCharCode(binary[i]);
    }
    return btoa(binaryString);
  }

  /**
   * 识别音频文件
   */
  async recognizeFile(
    audioFile: File,
    onResult: (result: RecognitionResult) => void,
    onError: (error: RecognitionError) => void,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log('📁 开始处理音频文件:', audioFile.name);
      
      // 转换音频文件
      onProgress?.(10);
      const pcmBuffer = await this.convertAudioToPCM(audioFile);
      console.log('✅ 音频转换完成, PCM大小:', pcmBuffer.byteLength);
      
      onProgress?.(30);
      
      // 创建WebSocket连接
      const authUrl = this.generateAuthUrl();
      this.websocket = new WebSocket(authUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket连接已建立');
        onProgress?.(40);

        // 发送开始参数
        const params = {
          common: {
            app_id: this.config.appId,
          },
          business: {
            language: 'zh_cn',
            domain: 'iat',
            accent: 'mandarin',
            vad_eos: 2000,
            dwa: 'wpgs',
          },
          data: {
            status: 0, // 第一帧
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
          },
        };

        this.websocket?.send(JSON.stringify(params));

        // 分片发送音频数据
        const chunkSize = 1280 * 10; // 每次发送约0.4秒的音频
        let offset = 0;

        const sendChunk = () => {
          if (offset >= pcmBuffer.byteLength) {
            // 发送结束标志
            const endParams = {
              data: {
                status: 2, // 结束
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: '',
              },
            };
            this.websocket?.send(JSON.stringify(endParams));
            console.log('✅ 音频数据发送完成');
            onProgress?.(90);
            return;
          }

          const chunk = pcmBuffer.slice(offset, offset + chunkSize);
          const base64Audio = this.arrayBufferToBase64(chunk);

          const dataParams = {
            data: {
              status: 1, // 传输中
              format: 'audio/L16;rate=16000',
              encoding: 'raw',
              audio: base64Audio,
            },
          };

          this.websocket?.send(JSON.stringify(dataParams));

          offset += chunkSize;
          const progress = 40 + Math.floor((offset / pcmBuffer.byteLength) * 50);
          onProgress?.(progress);

          // 控制发送速度,避免过快
          setTimeout(sendChunk, 40);
        };

        // 开始发送
        setTimeout(sendChunk, 100);
      };

      this.websocket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        if (response.code !== 0) {
          onError({
            code: response.code,
            message: response.message || '识别失败',
          });
          this.close();
          return;
        }

        // 解析识别结果
        if (response.data && response.data.result) {
          const result = response.data.result;
          const ws = result.ws || [];

          let text = '';
          ws.forEach((item: any) => {
            item.cw.forEach((word: any) => {
              text += word.w;
            });
          });

          onResult({
            text,
            isFinal: response.data.status === 2,
            confidence: result.confidence,
          });

          // 如果识别结束
          if (response.data.status === 2) {
            console.log('✅ 识别完成');
            onProgress?.(100);
            this.close();
          }
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket错误:', error);
        onError({
          code: -1,
          message: 'WebSocket连接错误',
        });
        this.close();
      };

      this.websocket.onclose = () => {
        console.log('🔌 WebSocket连接已关闭');
      };

    } catch (error) {
      console.error('❌ 识别失败:', error);
      onError({
        code: -1,
        message: error instanceof Error ? error.message : '识别失败',
      });
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}

export const iflytekFileASR = new IFlyTekFileASRService();
