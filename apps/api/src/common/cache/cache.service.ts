import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache with Cache Stampede Protection (Request Coalescing / Single-Flight).
 *
 * NOTE: On Vercel/serverless each function instance has its own process memory.
 * For cross-instance caching, pair with HTTP headers (Cache-Control) where applicable.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | undefined {
    try {
      const entry = this.store.get(key);
      if (!entry) return undefined;

      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return undefined;
      }

      return entry.value as T;
    } catch (err) {
      this.logger.warn(`Cache get error for key "${key}": ${(err as Error).message}`);
      return undefined;
    }
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    try {
      this.store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    } catch (err) {
      this.logger.warn(`Cache set error for key "${key}": ${(err as Error).message}`);
    }
  }

  /**
   * Request-coalescing get-or-set with cache stampede protection.
   * If 10 concurrent requests arrive for a cold key, only 1 DB query is executed.
   */
  async getOrSet<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await factory();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  delete(key: string): void {
    try {
      this.store.delete(key);
    } catch {}
  }

  deleteByPrefix(prefix: string): void {
    try {
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } catch {}
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }
}
