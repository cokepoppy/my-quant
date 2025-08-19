import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Run backtest
router.post('/run', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Backtest run endpoint - to be implemented',
    data: {}
  });
});

// Get backtest results
router.get('/results/:id', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Backtest results endpoint - to be implemented',
    data: {}
  });
});

export default router;