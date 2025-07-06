import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { SessionModel } from '../models/Session';
import { AuthUtils } from '../utils/auth';
import { createAuthenticationTokens, refreshAccessToken } from '../utils/refreshToken';
import { performLogout } from '../utils/tokenBlacklist';
import { extractTokenFromHeader } from '../utils/jwt';
import { UserPayload, JWTPayload } from '../types/jwt';
import { UserStatus } from '../types/user';
import { logger } from '../utils/logger';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * Register a new user
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const { email, password } = registerSchema.parse(req.body);

    // Additional password validation
    const passwordValidation = AuthUtils.isValidPassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
      return;
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create user
    const user = await UserModel.create({
      email: AuthUtils.sanitizeInput(email),
      password: hashedPassword
    });

    // Create session
    const sessionToken = AuthUtils.generateSecureToken();
    const session = await SessionModel.create({
      user_id: user.id,
      token: sessionToken,
      expires_at: AuthUtils.calculateSessionExpiration(),
      ip_address: AuthUtils.getClientIp(req),
      user_agent: AuthUtils.getUserAgent(req) || undefined
    });

    // Generate JWT tokens
    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      roles: [] // Default roles
    };

    const tokens = await createAuthenticationTokens(userPayload, {
      ipAddress: AuthUtils.getClientIp(req),
      userAgent: AuthUtils.getUserAgent(req) || undefined
    });

    logger.info('User registered successfully', { 
      userId: user.id, 
      email: user.email 
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        status: user.status
      },
      tokens
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
}

/**
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await UserModel.findByEmail(email, true);
    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
      return;
    }

    // Check if account is locked
    if (AuthUtils.isAccountLocked(user.locked_until)) {
      res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to failed login attempts'
      });
      return;
    }

    // Verify password
    const passwordValid = await AuthUtils.verifyPassword(password, (user as any).password_hash);
    if (!passwordValid) {
      // Increment failed attempts
      await UserModel.incrementFailedLoginAttempts(user.id);
      
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Update last login and reset failed attempts
    await UserModel.updateLastLogin(user.id);

    // Create session
    const sessionToken = AuthUtils.generateSecureToken();
    const session = await SessionModel.create({
      user_id: user.id,
      token: sessionToken,
      expires_at: AuthUtils.calculateSessionExpiration(),
      ip_address: AuthUtils.getClientIp(req),
      user_agent: AuthUtils.getUserAgent(req) || undefined
    });

    // Generate JWT tokens
    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      roles: [] // TODO: Get actual roles from database
    };

    const tokens = await createAuthenticationTokens(userPayload, {
      ipAddress: AuthUtils.getClientIp(req),
      userAgent: AuthUtils.getUserAgent(req) || undefined
    });

    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email 
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        last_login: user.last_login,
        status: user.status
      },
      tokens
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
}

/**
 * Logout user
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(400).json({
        error: 'No token provided',
        message: 'Token is required for logout'
      });
      return;
    }

    // Get refresh token from body if provided
    const refreshToken = req.body.refreshToken;

    // Blacklist tokens
    const logoutSuccess = await performLogout(token, refreshToken);

    if (logoutSuccess) {
      logger.info('User logged out successfully', { 
        userId: req.user?.id 
      });
      
      res.json({
        message: 'Logged out successfully'
      });
    } else {
      res.status(500).json({
        error: 'Logout failed',
        message: 'Failed to invalidate tokens'
      });
    }
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
}

/**
 * Refresh access token
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body);

    // Refresh tokens
    const tokens = await refreshAccessToken(refreshToken, true);

    logger.info('Tokens refreshed successfully');

    res.json({
      message: 'Tokens refreshed successfully',
      tokens
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    if (error.name === 'TokenInvalidError' || error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Please login again'
      });
      return;
    }

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing tokens'
    });
  }
}

/**
 * Get current user info
 */
export async function getUserInfo(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    // Get user from database
    const user = await UserModel.findById(userId);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        status: user.status,
        email_verified: user.email_verified,
        last_login: user.last_login
      }
    });
  } catch (error: any) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'An error occurred while fetching user information'
    });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    const updateSchema = z.object({
      email: z.string().email('Invalid email format').optional()
    });

    const updateData = updateSchema.parse(req.body);

    // Check if email already exists if updating email
    if (updateData.email) {
      const existingUser = await UserModel.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        res.status(409).json({
          error: 'Email already exists',
          message: 'A user with this email already exists'
        });
        return;
      }
    }

    // Update user
    const updatedUser = await UserModel.update(userId, updateData);
    
    if (!updatedUser) {
      res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
      return;
    }

    logger.info('User profile updated successfully', { 
      userId: userId 
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        updated_at: updatedUser.updated_at,
        status: updatedUser.status,
        email_verified: updatedUser.email_verified
      }
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    res.status(500).json({
      error: 'Profile update failed',
      message: 'An error occurred while updating profile'
    });
  }
}