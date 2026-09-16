import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import DashboardScreen from './pages/DashboardScreen';
import AddDutyScreen from './pages/AddDutyScreen';
import MyDutiesScreen from './pages/MyDutiesScreen';
import ProfileScreen from './pages/ProfileScreen';
import BottomNav from './components/BottomNav';
import './styles/App.css';

// Layout wrapper that controls the presence of BottomNav on mobile
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Hide bottom nav on splash and login screens
  const isSplash = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const showNav = !isSplash && !isLogin;

  return (
    <div className={`app-container ${isLogin ? 'login-page-container' : ''}`}>
      <div
        className={`app-shell ${isLogin ? 'login-app-shell' : ''} ${
          isSplash ? 'splash-app-shell' : ''
        }`}
      >
        <div className={`app-content ${!showNav ? 'no-nav-content' : ''}`}>{children}</div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/add-duty" element={<AddDutyScreen />} />
          <Route path="/my-duties" element={<MyDutiesScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
