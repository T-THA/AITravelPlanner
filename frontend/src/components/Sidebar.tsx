import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  DollarOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制面板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'itinerary',
      icon: <UnorderedListOutlined />,
      label: '行程管理',
      children: [
        {
          key: '/itineraries',
          label: '我的行程',
          onClick: () => navigate('/itineraries'),
        },
        {
          key: '/itineraries/create',
          icon: <PlusCircleOutlined />,
          label: '创建行程',
          onClick: () => navigate('/itineraries/create'),
        },
      ],
    },
    {
      key: '/expenses',
      icon: <DollarOutlined />,
      label: '费用管理',
      onClick: () => navigate('/expenses'),
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: '/about',
      icon: <InfoCircleOutlined />,
      label: '关于',
      onClick: () => navigate('/about'),
    },
    // 隐藏测试功能（生产环境）
    // {
    //   type: 'divider',
    // },
    // {
    //   key: 'test',
    //   icon: <ExperimentOutlined />,
    //   label: '测试功能',
    //   children: [
    //     {
    //       key: '/voice-test',
    //       label: '语音测试',
    //       onClick: () => navigate('/voice-test'),
    //     },
    //     {
    //       key: '/map-test',
    //       label: '地图测试',
    //       onClick: () => navigate('/map-test'),
    //     },
    //     {
    //       key: '/dashscope-test',
    //       label: 'AI测试',
    //       onClick: () => navigate('/dashscope-test'),
    //     },
    //   ],
    // },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    // 如果是二级路由,也要高亮父级
    if (path.startsWith('/itineraries')) {
      return [path];
    }
    return [path];
  };

  // 获取当前展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/itineraries')) {
      return ['itinerary'];
    }
    if (path.includes('test')) {
      return ['test'];
    }
    return [];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={220}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? '18px' : '20px',
          fontWeight: 'bold',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {collapsed ? '🧳' : '🧳 AI旅行规划师'}
      </div>

      {/* 导航菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
