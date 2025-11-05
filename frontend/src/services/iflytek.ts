/**
 * 科大讯飞语音识别服务
 * 文档: https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */

import CryptoJS from 'crypto-js';

// WebSocket 连接状态
export const WebSocketStatus = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
} as const;

export type WebSocketStatus = (typeof WebSocketStatus)[keyof typeof WebSocketStatus];

// 识别结果类型
export interface RecognitionResult {
  text: string; // 识别的文本
  isFinal: boolean; // 是否为最终结果
  confidence?: number; // 置信度
}

// 错误类型
export interface RecognitionError {
  code: number;
  message: string;
}

// 配置参数
interface IFlyTekConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

class IFlyTekASRService {
  private config: IFlyTekConfig;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;

  // 回调函数
  private onResultCallback?: (result: RecognitionResult) => void;
  private onErrorCallback?: (error: RecognitionError) => void;
  private onStatusChangeCallback?: (status: WebSocketStatus) => void;

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_IFLYTEK_APP_ID,
      apiKey: import.meta.env.VITE_IFLYTEK_API_KEY,
      apiSecret: import.meta.env.VITE_IFLYTEK_API_SECRET,
    };

    // 验证配置
    if (!this.config.appId || !this.config.apiKey || !this.config.apiSecret) {
      console.warn(
        '⚠️  科大讯飞 API 配置不完整，请在 .env 文件中配置:\n' +
          '   VITE_IFLYTEK_APP_ID\n' +
          '   VITE_IFLYTEK_API_KEY\n' +
          '   VITE_IFLYTEK_API_SECRET'
      );
    }
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

    // 拼接签名原文
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;

    // 使用 hmac-sha256 加密
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);

    // 拼接 authorization
    const authorizationOrigin = `api_key="${this.config.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);

    // 拼接 URL
    return `${url}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  }

  /**
   * 开始录音和识别
   */
  async startRecognition(
    onResult: (result: RecognitionResult) => void,
    onError: (error: RecognitionError) => void,
    onStatusChange?: (status: WebSocketStatus) => void
  ): Promise<void> {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStatusChangeCallback = onStatusChange;

    try {
      // 检查是否支持 getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isHttps && !isLocalhost) {
          throw new Error('语音输入需要HTTPS环境或localhost。请使用HTTPS访问或在本地测试。');
        } else {
          throw new Error('您的浏览器不支持语音输入功能，请使用Chrome、Edge或Firefox浏览器。');
        }
      }

      // 1. 请求麦克风权限
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // 2. 创建 WebSocket 连接
      const authUrl = this.generateAuthUrl();
      this.websocket = new WebSocket(authUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket 连接已建立');
        this.onStatusChangeCallback?.(WebSocketStatus.OPEN);

        // 发送开始参数
        const params = {
          common: {
            app_id: this.config.appId,
          },
          business: {
            language: 'zh_cn', // 中文
            domain: 'iat', // 通用领域
            accent: 'mandarin', // 普通话
            vad_eos: 2000, // 语音结束检测时间(ms)
            dwa: 'wpgs', // 动态修正
          },
          data: {
            status: 0, // 开始识别
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
          },
        };

        this.websocket?.send(JSON.stringify(params));

        // 3. 开始录音并发送音频数据
        this.startRecording();
      };

      this.websocket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        if (response.code !== 0) {
          this.onErrorCallback?.({
            code: response.code,
            message: response.message || '识别失败',
          });
          this.stopRecognition();
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

          this.onResultCallback?.({
            text,
            isFinal: response.data.status === 2,
            confidence: result.confidence,
          });

          // 如果识别结束,关闭连接
          if (response.data.status === 2) {
            console.log('✅ 识别完成');
            this.stopRecognition();
          }
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
        this.onErrorCallback?.({
          code: -1,
          message: 'WebSocket 连接错误',
        });
        this.stopRecognition();
      };

      this.websocket.onclose = () => {
        console.log('🔌 WebSocket 连接已关闭');
        this.onStatusChangeCallback?.(WebSocketStatus.CLOSED);
      };
    } catch (error) {
      console.error('❌ 启动识别失败:', error);
      this.onErrorCallback?.({
        code: -1,
        message: error instanceof Error ? error.message : '启动识别失败',
      });
    }
  }

  /**
   * 开始录音
   */
  private startRecording(): void {
    if (!this.audioStream) return;

    // 创建音频上下文
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.audioStream);

    // 创建音频处理器
    const processor = this.audioContext.createScriptProcessor(8192, 1, 1);

    source.connect(processor);
    processor.connect(this.audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (this.websocket?.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      // 转换为 16bit PCM
      const pcmData = this.floatTo16BitPCM(inputData);

      // 发送音频数据
      const params = {
        data: {
          status: 1, // 传输中
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: this.arrayBufferToBase64(pcmData),
        },
      };

      this.websocket?.send(JSON.stringify(params));
    };
  }

  /**
   * 停止录音和识别
   */
  stopRecognition(): void {
    // 发送结束标识
    if (this.websocket?.readyState === WebSocket.OPEN) {
      const params = {
        data: {
          status: 2, // 结束
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: '',
        },
      };
      this.websocket.send(JSON.stringify(params));
    }

    // 关闭 WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // 停止音频流
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onStatusChangeCallback?.(WebSocketStatus.CLOSED);
  }

  /**
   * Float32Array 转 16bit PCM
   */
  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output.buffer;
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 检查浏览器是否支持
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.WebSocket &&
      window.AudioContext
    );
  }
}

// 导出单例和类
export { IFlyTekASRService };
export const iflytekASRService = new IFlyTekASRService();
