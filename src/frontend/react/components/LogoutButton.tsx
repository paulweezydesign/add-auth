import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { AuthClientError } from '../../shared';

export interface LogoutButtonProps {
  label?: string;
  loggingOutLabel?: string;
  className?: string;
  onError?: (error: AuthClientError) => void;
  onSuccess?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  label = 'Log out',
  loggingOutLabel = 'Logging out…',
  className,
  onError,
  onSuccess,
}) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await auth.logout();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to log out';
      setError(message);
      if (err instanceof AuthClientError) {
        onError?.(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={['add-auth-logout', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="add-auth-logout__button"
        onClick={handleClick}
        disabled={isLoading || auth.status === 'loading'}
      >
        {isLoading || auth.status === 'loading' ? loggingOutLabel : label}
      </button>
      {error && (
        <div className="add-auth-logout__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default LogoutButton;
