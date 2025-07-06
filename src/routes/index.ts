import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Add-Auth API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile'
      }
    }
  });
});

export default router;