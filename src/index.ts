import { AuthClient, AuthClientError } from './frontend/authClient';
import { AuthForm } from './components/react/AuthForm';
import { AuthStatus } from './components/react/AuthStatus';
import { createAuthWidget } from './components/vanilla/createAuthWidget';

export type {
  AuthClientOptions,
  AuthCredentials,
  AuthResponse,
  PasswordResetPayload,
  AuthClientInterface,
} from './frontend/authClient';
export { AuthClient, AuthClientError } from './frontend/authClient';

export type { AuthFormProps } from './components/react/AuthForm';
export { AuthForm } from './components/react/AuthForm';
export type { AuthStatusProps } from './components/react/AuthStatus';
export { AuthStatus } from './components/react/AuthStatus';

export type {
  AuthWidgetOptions,
  AuthWidgetHandle,
  AuthWidgetMode,
} from './components/vanilla/createAuthWidget';
export { createAuthWidget } from './components/vanilla/createAuthWidget';

export default {
  AuthClient,
  AuthClientError,
  AuthForm,
  AuthStatus,
  createAuthWidget,
};
