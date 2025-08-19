import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get system metrics
router.get('/metrics', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'System metrics endpoint - to be implemented',
    data: {}
  });
});

// Get alerts
router.get('/alerts', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Alerts endpoint - to be implemented',
    data: {}
  });
});

export default router;