import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { query, validationResult } from 'express-validator';
import { cpus, totalmem, freemem } from 'os';

const router = Router();
const prisma = new PrismaClient();

// Get system metrics
router.get('/metrics', authenticate, [
  query('period').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Invalid period')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '1h';
    
    // System metrics
    const systemMetrics = getSystemMetrics();
    
    // Database metrics
    const dbMetrics = await getDatabaseMetrics();
    
    // Application metrics
    const appMetrics = await getApplicationMetrics(period);
    
    // Recent system logs
    const recentLogs = await getRecentSystemLogs();

    res.json({
      success: true,
      message: 'System metrics retrieved successfully',
      data: {
        system: systemMetrics,
        database: dbMetrics,
        application: appMetrics,
        recentLogs,
        timestamp: new Date(),
        period
      }
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get alerts
router.get('/alerts', authenticate, [
  query('status').optional().isIn(['all', 'active', 'resolved']).withMessage('Invalid status'),
  query('severity').optional().isIn(['all', 'low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const status = req.query.status as string || 'all';
    const severity = req.query.severity as string || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Generate mock alerts based on system logs
    const alerts = await generateAlerts(status, severity, limit);
    
    // Get alert statistics
    const alertStats = await getAlertStatistics();

    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: {
        alerts,
        statistics: alertStats,
        pagination: {
          page,
          limit,
          total: alerts.length,
          pages: Math.ceil(alerts.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get performance dashboard
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    // Real-time metrics
    const realtimeMetrics = {
      cpu: getCPUUsage(),
      memory: getMemoryUsage(),
      disk: getDiskUsage(),
      network: getNetworkUsage(),
      uptime: process.uptime()
    };

    // Historical data (last 24 hours)
    const historicalData = await getHistoricalMetrics('24h');

    // Active alerts count
    const activeAlerts = await getActiveAlertsCount();

    // System health status
    const systemHealth = calculateSystemHealth(realtimeMetrics);

    res.json({
      success: true,
      message: 'Performance dashboard retrieved successfully',
      data: {
        realtime: realtimeMetrics,
        historical: historicalData,
        alerts: {
          active: activeAlerts,
          critical: activeAlerts.filter(a => a.severity === 'critical').length
        },
        health: systemHealth,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching performance dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create alert
router.post('/alerts', authenticate, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('type').optional().isString().withMessage('Type must be a string')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, message, severity, type = 'user' } = req.body;

    // Create system log entry for the alert
    const systemLog = await prisma.systemLog.create({
      data: {
        level: severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info',
        message: `[ALERT] ${title}: ${message}`,
        metadata: {
          type,
          severity,
          userId: req.user!.id,
          timestamp: new Date()
        },
        source: 'monitoring'
      }
    });

    res.json({
      success: true,
      message: 'Alert created successfully',
      data: {
        alertId: systemLog.id,
        title,
        severity,
        timestamp: systemLog.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve alert
router.post('/alerts/:id/resolve', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Find and update the alert
    const alert = await prisma.systemLog.findFirst({
      where: {
        id,
        source: 'monitoring',
        message: { startsWith: '[ALERT]' }
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Create resolution log
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Alert resolved: ${alert.message}`,
        metadata: {
          resolvedBy: req.user!.id,
          resolvedAt: new Date(),
          originalAlertId: id
        },
        source: 'monitoring'
      }
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get monitoring logs
router.get('/logs', authenticate, [
  query('level').optional().isIn(['all', 'info', 'warn', 'error', 'debug']).withMessage('Invalid level'),
  query('source').optional().isString().withMessage('Source must be a string'),
  query('startTime').optional().isISO8601().withMessage('Start time must be valid ISO8601 date'),
  query('endTime').optional().isISO8601().withMessage('End time must be valid ISO8601 date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const level = req.query.level as string || 'all';
    const source = req.query.source as string;
    const startTime = req.query.startTime as string;
    const endTime = req.query.endTime as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (level !== 'all') {
      whereClause.level = level;
    }

    if (source) {
      whereClause.source = source;
    }

    if (startTime) {
      whereClause.createdAt = { gte: new Date(startTime) };
    }

    if (endTime) {
      whereClause.createdAt = { 
        ...whereClause.createdAt, 
        lte: new Date(endTime) 
      };
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.systemLog.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      message: 'Monitoring logs retrieved successfully',
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching monitoring logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monitoring logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function getSystemMetrics() {
  const totalMemory = totalmem();
  const freeMemory = freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  const cpuCount = cpus().length;
  
  return {
    cpu: {
      usage: Math.random() * 100, // Mock CPU usage
      cores: cpuCount,
      loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: memoryUsage
    },
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version
  };
}

async function getDatabaseMetrics() {
  try {
    // Get user count
    const userCount = await prisma.user.count();
    
    // Get strategy count
    const strategyCount = await prisma.strategy.count();
    
    // Get trade count
    const tradeCount = await prisma.trade.count();
    
    // Get backtest count
    const backtestCount = await prisma.backtest.count();
    
    return {
      users: userCount,
      strategies: strategyCount,
      trades: tradeCount,
      backtests: backtestCount,
      status: 'connected'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection error'
    };
  }
}

async function getApplicationMetrics(period: string) {
  const now = new Date();
  const periodMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  
  const startTime = new Date(now.getTime() - periodMs[period as keyof typeof periodMs]);
  
  // Get request count from system logs
  const requestCount = await prisma.systemLog.count({
    where: {
      source: 'api',
      createdAt: { gte: startTime }
    }
  });
  
  // Get error count
  const errorCount = await prisma.systemLog.count({
    where: {
      level: 'error',
      createdAt: { gte: startTime }
    }
  });
  
  return {
    requests: requestCount,
    errors: errorCount,
    errorRate: requestCount > 0 ? (errorCount / requestCount) * 100 : 0,
    uptime: process.uptime(),
    period
  };
}

async function getRecentSystemLogs() {
  return await prisma.systemLog.findMany({
    where: {
      level: { in: ['error', 'warn'] }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });
}

async function generateAlerts(status: string, severity: string, limit: number) {
  const alerts = [];
  
  // Generate mock alerts based on system logs
  const mockAlerts = [
    {
      id: '1',
      title: 'High CPU Usage',
      message: 'CPU usage exceeded 80% threshold',
      severity: 'high',
      type: 'system',
      status: 'active',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      resolvedAt: null
    },
    {
      id: '2',
      title: 'Database Connection Slow',
      message: 'Database response time exceeded 5 seconds',
      severity: 'medium',
      type: 'database',
      status: 'active',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      resolvedAt: null
    },
    {
      id: '3',
      title: 'Memory Usage Warning',
      message: 'Memory usage is above 90%',
      severity: 'critical',
      type: 'system',
      status: 'active',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolvedAt: null
    }
  ];
  
  // Filter by status and severity
  let filteredAlerts = mockAlerts;
  
  if (status !== 'all') {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
  }
  
  if (severity !== 'all') {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
  }
  
  return filteredAlerts.slice(0, limit);
}

async function getAlertStatistics() {
  const activeAlerts = await generateAlerts('active', 'all', 100);
  
  const stats = {
    total: activeAlerts.length,
    bySeverity: {
      low: activeAlerts.filter(a => a.severity === 'low').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length
    },
    byType: {
      system: activeAlerts.filter(a => a.type === 'system').length,
      database: activeAlerts.filter(a => a.type === 'database').length,
      application: activeAlerts.filter(a => a.type === 'application').length
    }
  };
  
  return stats;
}

function getCPUUsage() {
  return {
    current: Math.random() * 100,
    average1m: Math.random() * 100,
    average5m: Math.random() * 100,
    average15m: Math.random() * 100
  };
}

function getMemoryUsage() {
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  
  return {
    total,
    used,
    free,
    usage: (used / total) * 100
  };
}

function getDiskUsage() {
  return {
    total: 100 * 1024 * 1024 * 1024, // 100GB mock
    used: Math.random() * 100 * 1024 * 1024 * 1024,
    free: Math.random() * 100 * 1024 * 1024 * 1024,
    usage: Math.random() * 100
  };
}

function getNetworkUsage() {
  return {
    incoming: Math.random() * 1024 * 1024, // Mock bytes
    outgoing: Math.random() * 1024 * 1024,
    packetsIn: Math.floor(Math.random() * 10000),
    packetsOut: Math.floor(Math.random() * 10000)
  };
}

async function getHistoricalMetrics(period: string) {
  const points = period === '24h' ? 24 : 7;
  const data = [];
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
    
    data.push({
      timestamp,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    });
  }
  
  return data;
}

async function getActiveAlertsCount() {
  const alerts = await generateAlerts('active', 'all', 100);
  return alerts;
}

function calculateSystemHealth(metrics: any) {
  const cpuHealth = metrics.cpu.current < 80 ? 'good' : metrics.cpu.current < 90 ? 'warning' : 'critical';
  const memoryHealth = metrics.memory.usage < 80 ? 'good' : metrics.memory.usage < 90 ? 'warning' : 'critical';
  const diskHealth = metrics.disk.usage < 80 ? 'good' : metrics.disk.usage < 90 ? 'warning' : 'critical';
  
  const overall = cpuHealth === 'good' && memoryHealth === 'good' && diskHealth === 'good' ? 'good' : 
                 cpuHealth === 'critical' || memoryHealth === 'critical' || diskHealth === 'critical' ? 'critical' : 'warning';
  
  return {
    overall,
    cpu: cpuHealth,
    memory: memoryHealth,
    disk: diskHealth,
    uptime: metrics.uptime > 3600 ? 'good' : 'warning'
  };
}

export default router;