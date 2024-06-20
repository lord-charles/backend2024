import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (error) {
      // Add error handling or logging here
      console.error('Error getting cache key:', key, error);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    // Default TTL of 1 hour
    try {
      await this.cache.set(key, value, ttl); // Passing TTL as a number
    } catch (error) {
      // Add error handling or logging here
      console.error('Error setting cache key:', key, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      // Add error handling or logging here
      console.error('Error deleting cache key:', key, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cache.reset();
    } catch (error) {
      // Add error handling or logging here
      console.error('Error resetting cache:', error);
    }
  }
}
