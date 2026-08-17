export type AuthMethod = 'jwt' | 'session' | 'oauth';

export interface AuthContext {
  userId: string;
  email: string;
  sessionId?: string;
  roles: string[];
  permissions: string[];
  trustScore?: number;
  authMethod: AuthMethod;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }

    interface User {
      id: string;
      email: string;
      roles?: string[];
      sessionId?: string;
      jti?: string;
    }
  }
}

export {};
