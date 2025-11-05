/**
 * 关于页面
 * 介绍AI旅行规划师项目
 */

import React from 'react';
import { Card, Typography, Space, Divider, Tag, Button, Row, Col } from 'antd';
import {
  GithubOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  CloudOutlined,
  ApiOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  SoundOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
  // GitHub仓库地址
  const githubUrl = 'https://github.com/T-THA/AITravelPlanner';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 项目标题 */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '48px 24px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: 64 }} />
          <Title level={1} style={{ color: 'white', margin: 0 }}>
            AI 旅行规划师
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, margin: 0 }}>
            基于人工智能的智能旅行规划助手
          </Paragraph>
          <div>
            <Tag color="cyan">React 18</Tag>
            <Tag color="blue">TypeScript</Tag>
            <Tag color="purple">Ant Design</Tag>
            <Tag color="geekblue">Supabase</Tag>
            <Tag color="magenta">通义千问</Tag>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<GithubOutlined />}
            href={githubUrl}
            target="_blank"
            style={{ background: '#24292e', borderColor: '#24292e' }}
          >
            查看源码
          </Button>
        </Space>
      </Card>

      {/* 项目简介 */}
      <Card title={<><TeamOutlined /> 项目简介</>} style={{ marginBottom: 24 }}>
        <Paragraph style={{ fontSize: 16, lineHeight: '1.8' }}>
          AI旅行规划师是一个现代化的智能旅行规划Web应用，利用人工智能技术为用户提供个性化的旅行方案。
          通过集成多个先进的API服务，系统能够根据用户的需求、预算和偏好，自动生成详细的行程安排，
          包括每日计划、住宿推荐、交通方案和预算分配。
        </Paragraph>
        <Paragraph style={{ fontSize: 16, lineHeight: '1.8' }}>
          项目采用前后端分离架构，前端使用React 18 + TypeScript构建，后端使用Supabase提供数据存储和用户认证，
          并集成了阿里云通义千问大模型、科大讯飞语音识别、高德地图等多项第三方服务，
          为用户提供流畅、智能的旅行规划体验。
        </Paragraph>
      </Card>

      {/* 核心功能 */}
      <Card title={<><ThunderboltOutlined /> 核心功能</>} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  <ApiOutlined style={{ color: '#1890ff' }} /> AI智能规划
                </Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  基于通义千问大模型，根据目的地、天数、预算和偏好，自动生成个性化行程方案，
                  包括每日安排、景点推荐、住宿和交通建议。
                </Paragraph>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  <SoundOutlined style={{ color: '#52c41a' }} /> 语音输入
                </Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  集成科大讯飞语音识别，支持语音输入旅行需求和费用记录，
                  AI自动解析语音内容并填充表单，大幅提升输入效率。
                </Paragraph>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  <EnvironmentOutlined style={{ color: '#722ed1' }} /> 地图可视化
                </Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  集成高德地图API，在地图上标注每日行程景点，支持POI搜索、
                  路径规划和地点详情查看，直观展示行程路线。
                </Paragraph>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: 16 }}>
                  <DollarOutlined style={{ color: '#fa8c16' }} /> 费用管理
                </Text>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  记录和统计旅行费用，支持多种费用类别和支付方式，
                  提供可视化图表分析，实时对比预算使用情况。
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 技术栈 */}
      <Card title={<><CloudOutlined /> 技术栈</>} style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card type="inner" title="前端技术" size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Tag color="blue">React 18</Tag>
                  <Text type="secondary">现代化前端框架</Text>
                </div>
                <div>
                  <Tag color="blue">TypeScript</Tag>
                  <Text type="secondary">类型安全</Text>
                </div>
                <div>
                  <Tag color="purple">Ant Design</Tag>
                  <Text type="secondary">企业级UI组件库</Text>
                </div>
                <div>
                  <Tag color="cyan">Vite</Tag>
                  <Text type="secondary">快速构建工具</Text>
                </div>
                <div>
                  <Tag color="geekblue">Zustand</Tag>
                  <Text type="secondary">状态管理</Text>
                </div>
                <div>
                  <Tag color="gold">ECharts</Tag>
                  <Text type="secondary">数据可视化</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card type="inner" title="后端服务" size="small">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Tag color="green">Supabase</Tag>
                  <Text type="secondary">PostgreSQL数据库 + 认证</Text>
                </div>
                <div>
                  <Tag color="magenta">阿里云通义千问</Tag>
                  <Text type="secondary">大语言模型</Text>
                </div>
                <div>
                  <Tag color="red">科大讯飞</Tag>
                  <Text type="secondary">语音识别API</Text>
                </div>
                <div>
                  <Tag color="blue">高德地图</Tag>
                  <Text type="secondary">地图服务</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 特色亮点 */}
      <Card title={<><SafetyOutlined /> 特色亮点</>} style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>🎯 智能化程度高</Text>
            <Paragraph type="secondary">
              深度集成AI能力，不仅能生成行程，还能分析预算、解析语音输入，
              真正做到智能化旅行规划。
            </Paragraph>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>🚀 性能优化</Text>
            <Paragraph type="secondary">
              代码分割、懒加载、防抖节流等多项性能优化措施，
              首屏加载时间小于3秒，Lighthouse性能评分80+。
            </Paragraph>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>💎 用户体验优秀</Text>
            <Paragraph type="secondary">
              精心设计的交互流程，语音输入、实时搜索、地图联动等功能，
              提供流畅自然的使用体验。
            </Paragraph>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>🔒 安全可靠</Text>
            <Paragraph type="secondary">
              基于Supabase的RLS（行级安全）策略，确保用户数据隐私安全，
              采用JWT Token认证机制。
            </Paragraph>
          </div>
        </Space>
      </Card>

      {/* 开发团队 */}
      <Card title={<><TeamOutlined /> 开发信息</>}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>项目类型：</Text>
            <Text type="secondary"> AI4SE 课程项目</Text>
          </div>
          <div>
            <Text strong>开发周期：</Text>
            <Text type="secondary"> 7天敏捷开发</Text>
          </div>
          <div>
            <Text strong>开发模式：</Text>
            <Text type="secondary"> 迭代式开发，持续优化</Text>
          </div>
          <div>
            <Text strong>GitHub：</Text>
            <Button
              type="link"
              icon={<GithubOutlined />}
              href={githubUrl}
              target="_blank"
              style={{ padding: 0 }}
            >
              {githubUrl}
            </Button>
          </div>
          <div>
            <Text strong>开源协议：</Text>
            <Text type="secondary"> MIT License</Text>
          </div>
        </Space>
      </Card>

      {/* 底部版权 */}
      <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 24, color: '#999' }}>
        <Text type="secondary">
          © 2025 AI旅行规划师. 基于React + TypeScript + Supabase构建
        </Text>
      </div>
    </div>
  );
};

export default About;
