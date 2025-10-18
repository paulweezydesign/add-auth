export { startServer } from './server';
export { app } from './server';

export { createAuthClient } from './client/shared/createAuthClient';
export type {
  AuthClient,
  AuthClientOptions,
  AuthTokens,
  AuthUser,
  AuthResponse,
  LoginCredentials,
  RegistrationPayload
} from './client/shared/types';

export * from './client/react';
export * from './client/vanilla';
