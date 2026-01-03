import React, { useState, useTransition } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    
    startTransition(async () => {
      try {
        await login(email, password);
        navigate(from, { replace: true });
      } catch (err) {
        setLocalError(err.message || 'Failed to login');
      }
    });
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>Login</h2>
        {localError && <div className="error">{localError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          
          <button type="submit" disabled={isPending} style={{ width: '100%' }}>
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};
