import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', [
  authenticate,
  authorize(['admin'])
], asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get user by ID
router.get('/:id', [
  authenticate,
  authorize(['admin'])
], asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user
router.put('/:id', [
  authenticate,
  authorize(['admin']),
  body('email').optional().isEmail().normalizeEmail(),
  body('username').optional().isLength({ min: 3, max: 20 }).trim(),
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw createError('User not found', 404);
  }

  // Check for email/username conflicts
  if (updateData.email || updateData.username) {
    const conflictUser = await prisma.user.findFirst({
      where: {
        OR: [
          updateData.email ? { email: updateData.email, NOT: { id } } : {},
          updateData.username ? { username: updateData.username, NOT: { id } } : {}
        ]
      }
    });

    if (conflictUser) {
      throw createError('Email or username already exists', 400);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
}));

// Delete user (admin only)
router.delete('/:id', [
  authenticate,
  authorize(['admin'])
], asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user!.id) {
    throw createError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  await prisma.user.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Get user statistics
router.get('/stats/overview', [
  authenticate,
  authorize(['admin'])
], asyncHandler(async (req: AuthRequest, res) => {
  const [totalUsers, activeUsers, newUsersToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ]);

  const userStats = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      newUsersToday,
      userDistribution: userStats
    }
  });
}));

export default router;