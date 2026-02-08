import { changePassword } from '../auth';
import { UserModel } from '../../models/User';
import { AuthUtils } from '../../utils/auth';
import { SessionService } from '../../services/sessionService';
import { defaultPasswordSecurity } from '../../security/password-security';

jest.mock('../../models/User', () => ({
  UserModel: {
    findById: jest.fn(),
    updatePassword: jest.fn()
  }
}));

jest.mock('../../utils/auth', () => ({
  AuthUtils: {
    verifyPassword: jest.fn(),
    hashPassword: jest.fn()
  }
}));

jest.mock('../../services/sessionService', () => ({
  SessionService: {
    destroyUserSessions: jest.fn()
  }
}));

jest.mock('../../security/password-security', () => ({
  defaultPasswordSecurity: {
    validatePassword: jest.fn()
  }
}));

describe('changePassword controller', () => {
  it('updates password, invalidates sessions, and clears cookies', async () => {
    const req: any = {
      body: { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
      user: { id: 'user-1' }
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn()
    };

    (UserModel.findById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      password_hash: 'old-hash'
    });
    (AuthUtils.verifyPassword as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    (defaultPasswordSecurity.validatePassword as jest.Mock).mockReturnValue({
      isValid: true,
      errors: []
    });
    (AuthUtils.hashPassword as jest.Mock).mockResolvedValue('new-hash');

    await changePassword(req, res);

    expect(UserModel.updatePassword).toHaveBeenCalledWith('user-1', 'new-hash');
    expect(SessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    expect(res.clearCookie).toHaveBeenCalledWith('sessionId');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password updated successfully. Please log in again.'
    });
  });
});
