import * as crypto from 'crypto';
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

    const rawToken = 'raw-token';
    const expectedHashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const tokenData = {
      id: 'token-1',
      userId: 'user-1',
      email: 'test@example.com',
      token: rawToken,
      hashedToken: expectedHashedToken,
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
      isUsed: false
    };

    jest.spyOn(manager, 'validatePasswordResetToken').mockResolvedValue(tokenData);
    (AuthUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');

    const result = await manager.usePasswordResetToken(rawToken, 'NewPass123!');

    expect(result).toBe('hashed-password');
    expect(redisClient.setex).toHaveBeenCalledWith(
      `password-reset:${expectedHashedToken}`,
      expect.any(Number),
      expect.stringContaining('"isUsed":true')
    );
  });
});
