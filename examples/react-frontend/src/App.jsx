import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { Notification } from './components/Notification.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="app">
          <header className="app-header">
            <h1>Authentication Example</h1>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <Notification />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
