import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './stores/authStore';
import Loading from './components/Loading';
import MainLayout from './components/MainLayout';

// 公开页面
const HomePage = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const RegisterPage = React.lazy(() => import('./pages/Register'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPassword'));

// 受保护的页面
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const ItineraryListPage = React.lazy(() => import('./pages/ItineraryList'));
const CreateItineraryPage = React.lazy(() => import('./pages/CreateItinerary'));
const ExpenseManagementPage = React.lazy(() => import('./pages/ExpenseManagement'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const VoiceTestPage = React.lazy(() => import('./pages/VoiceTest'));
const MapTestPage = React.lazy(() => import('./pages/MapTest'));
const DashScopeTestPage = React.lazy(() => import('./pages/DashScopeTest'));

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  
  // 等待认证状态加载完成
  if (isLoading) {
    return <Loading />;
  }
  
  if (!isAuthenticated) {
    // 保存当前路径，登录后可以跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const setUser = useAuthStore(state => state.setUser);
  const setLoading = useAuthStore(state => state.setLoading);

  // 在应用启动时检查并恢复用户会话
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const { supabase } = await import('./services/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading]);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <React.Suspense fallback={<Loading />}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* 受保护的路由 - 使用 MainLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
            </Route>

            <Route
              path="/itineraries"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ItineraryListPage />} />
              <Route path="create" element={<CreateItineraryPage />} />
            </Route>

            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ExpenseManagementPage />} />
            </Route>

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfilePage />} />
            </Route>

            {/* 测试功能路由 */}
            <Route
              path="/voice-test"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<VoiceTestPage />} />
            </Route>

            <Route
              path="/map-test"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MapTestPage />} />
            </Route>

            <Route
              path="/dashscope-test"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashScopeTestPage />} />
            </Route>
            
            {/* 404 页面 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;

