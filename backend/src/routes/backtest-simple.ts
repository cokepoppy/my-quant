import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Simple test route for backtest
router.post('/start', authenticate, async (req: AuthRequest, res) => {
  try {
    console.log('Backtest start request received:', req.body);
    
    res.json({
      success: true,
      message: 'Backtest started successfully',
      data: {
        id: 'test-backtest-' + Date.now(),
        status: 'running',
        message: 'This is a test backtest'
      }
    });
  } catch (error) {
    console.error('Error starting backtest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start backtest',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;