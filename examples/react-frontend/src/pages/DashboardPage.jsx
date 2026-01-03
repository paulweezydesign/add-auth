import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { authService } = await import('../services/auth.js');
        const result = await authService.getCurrentUser();

        if (result.success) {
          setUserInfo(result.user);
        } else {
          showNotification('Failed to load user info', 'error');
        }
      } catch (error) {
        showNotification('Error loading user info', 'error');
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserInfo();
  }, [showNotification]);

  const handleLogout = async () => {
    await logout();
    showNotification('Logged out successfully', 'success');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Dashboard</h2>
        <div className="user-info">
          {userInfo ? (
            <div className="user-details">
              <p>
                <strong>ID:</strong> {userInfo.id}
              </p>
              <p>
                <strong>Email:</strong> {userInfo.email}
              </p>
              <p>
                <strong>Username:</strong> {userInfo.username}
              </p>
              <p>
                <strong>Created:</strong>{' '}
                {new Date(userInfo.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="error">Failed to load user info</p>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
    </div>
  );
};
