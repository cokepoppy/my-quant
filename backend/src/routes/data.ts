import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get market data
router.get('/market', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Market data endpoint - to be implemented',
    data: {}
  });
});

// Get historical data
router.get('/historical', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Historical data endpoint - to be implemented',
    data: {}
  });
});

export default router;