import React from 'react';
import { AuthProvider, AuthStatus, LoginForm, RegisterForm } from '../../src/client/react';

const DemoApp: React.FC = () => (
  <AuthProvider baseUrl="https://demo.add-auth.test/api/auth">
    <div>
      <AuthStatus />
      <LoginForm />
      <RegisterForm />
    </div>
  </AuthProvider>
);

export default DemoApp;
