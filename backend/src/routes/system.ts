import express from 'express';

const router = express.Router();

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    // Mock system logs data
    const mockLogs = [
      {
        id: '1',
        level: 'error',
        message: '数据库连接失败',
        source: 'database',
        metadata: { error: 'Connection timeout', stack: '...' },
        createdAt: '2024-01-01T10:00:00.000Z'
      },
      {
        id: '2',
        level: 'warn',
        message: 'API响应时间过长',
        source: 'api',
        metadata: { responseTime: 5000, endpoint: '/api/data' },
        createdAt: '2024-01-01T10:05:00.000Z'
      },
      {
        id: '3',
        level: 'info',
        message: '用户登录成功',
        source: 'system',
        metadata: { userId: '123', ip: '192.168.1.1' },
        createdAt: '2024-01-01T10:10:00.000Z'
      },
      {
        id: '4',
        level: 'debug',
        message: '策略执行开始',
        source: 'strategy',
        metadata: { strategyId: '456', symbol: 'BTCUSDT' },
        createdAt: '2024-01-01T10:15:00.000Z'
      }
    ];

    const { page = 1, limit = 20, level, source, keyword } = req.query;

    // Convert query parameters to numbers
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Filter logs based on criteria
    let filteredLogs = [...mockLogs];

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source === source);
    }

    if (keyword) {
      const keywordLower = keyword.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(keywordLower)
      );
    }

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate pagination
    const total = filteredLogs.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs'
    });
  }
});

export default router;