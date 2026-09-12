import { PasswordResetManager } from '../passwordReset';
import { AuthUtils } from '../../utils/auth';
import { redisClient } from '../../middleware/rateLimiter';

jest.mock('../../utils/auth', () => ({
  AuthUtils: {
    hashPassword: jest.fn()
  }
}));

jest.mock('../../middleware/rateLimiter', () => ({
  redisClient: {
    setex: jest.fn()
  }
}));

describe('PasswordResetManager.usePasswordResetToken', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns hashed password and marks token as used', async () => {
    const manager = new PasswordResetManager({
      requireStrongPassword: false,
      cleanupInterval: 1000000
    });

    const tokenData = {
      id: 'token-1',
      userId: 'user-1',
      email: 'test@example.com',
      token: 'raw-token',
      hashedToken: 'hashed-token',
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
      isUsed: false
    };

    jest.spyOn(manager, 'validatePasswordResetToken').mockResolvedValue(tokenData);
    (AuthUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');

    const result = await manager.usePasswordResetToken('raw-token', 'NewPass123!');

    expect(result).toBe('hashed-password');
    expect(redisClient.setex).toHaveBeenCalledWith(
      'password-reset:hashed-token',
      expect.any(Number),
      expect.stringContaining('"isUsed":true')
    );
  });
});
