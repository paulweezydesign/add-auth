import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>React Auth Example</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        A modern React 19+ application demonstrating JWT authentication.
      </p>
      
      <div style={{ marginTop: '2rem' }}>
        {user ? (
          <div className="card">
            <h3>Welcome back, {user.username}!</h3>
            <p>You are currently logged in.</p>
            <Link to="/dashboard">
              <button>Go to Dashboard</button>
            </Link>
          </div>
        ) : (
          <div className="card">
            <h3>Get Started</h3>
            <p>Please login or register to access the dashboard.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/login">
                <button>Login</button>
              </Link>
              <Link to="/register">
                <button style={{ backgroundColor: '#28a745' }}>Register</button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'left' }} className="card">
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>React 19+ (RC) Features</li>
          <li>Functional Components & Hooks</li>
          <li>Context API for Global Auth State</li>
          <li>Protected Routes</li>
          <li>JWT Token Management (Access + Refresh)</li>
          <li>Modern Async Transitions</li>
        </ul>
      </div>
    </div>
  );
};
