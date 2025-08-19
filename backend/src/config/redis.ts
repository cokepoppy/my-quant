import Redis from 'ioredis';
import config from '../config';

let redis: Redis;

if (process.env.NODE_ENV === 'production') {
  redis = new Redis(config.REDIS_URL);
} else {
  // In development, use globalThis to prevent multiple instances
  const globalWithRedis = globalThis as typeof globalThis & {
    redis: Redis | undefined;
  };
  
  if (!globalWithRedis.redis) {
    globalWithRedis.redis = new Redis(config.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    } as any);
  }
  
  redis = globalWithRedis.redis;
}

// Test Redis connection
export const testRedisConnection = async () => {
  try {
    await redis.connect();
    console.log('✅ Redis connected successfully');
    
    // Test basic operations
    await redis.set('test', 'connection');
    const result = await redis.get('test');
    await redis.del('test');
    
    if (result === 'connection') {
      console.log('✅ Redis operations working correctly');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
};

// Redis utility functions
export const cache = {
  async get(key: string): Promise<string | null> {
    return await redis.get(key);
  },
  
  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (expireInSeconds) {
      await redis.setex(key, expireInSeconds, value);
    } else {
      await redis.set(key, value);
    }
  },
  
  async del(key: string): Promise<void> {
    await redis.del(key);
  },
  
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },
  
  async ttl(key: string): Promise<number> {
    return await redis.ttl(key);
  }
};

export default redis;