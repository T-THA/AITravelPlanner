import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';

// 路由到面包屑映射
const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '控制面板',
  '/itineraries': '行程管理',
  '/itineraries/create': '创建行程',
  '/itineraries/detail': '行程详情',
  '/expenses': '费用管理',
  '/profile': '个人中心',
  '/settings': '设置',
  '/voice-test': '语音测试',
  '/map-test': '地图测试',
  '/dashscope-test': 'AI测试',
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);

  // 如果是根路径或登录页面,不显示面包屑
  if (pathSnippets.length === 0 || location.pathname === '/login') {
    return null;
  }

  const breadcrumbItems = [
    {
      title: (
        <Link to="/dashboard">
          <HomeOutlined />
        </Link>
      ),
    },
  ];

  // 构建面包屑路径
  pathSnippets.forEach((_snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const breadcrumbName = breadcrumbNameMap[url];

    if (breadcrumbName) {
      // 如果是最后一项,不显示链接
      if (index === pathSnippets.length - 1) {
        breadcrumbItems.push({
          title: <span>{breadcrumbName}</span>,
        });
      } else {
        breadcrumbItems.push({
          title: <Link to={url}>{breadcrumbName}</Link>,
        });
      }
    }
  });

  return <AntBreadcrumb items={breadcrumbItems} />;
};

export default Breadcrumb;
