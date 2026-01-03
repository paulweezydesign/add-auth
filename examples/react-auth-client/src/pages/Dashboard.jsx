import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="card">
        <h2>User Profile</h2>
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'User'}</p>
      </div>
      
      <div className="card">
        <h3>Protected Content</h3>
        <p>
          This page is only accessible to authenticated users. If you see this, 
          your JWT token is valid and working!
        </p>
      </div>
    </div>
  );
};
