/**
 * Cache Service
 * Handles client-side caching and offline data persistence
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface OfflineData {
  users: any[];
  products: any[];
  orders: any[];
  inventory: any[];
  feedback: any[];
  issues: any[];
  lastSync: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_PREFIX = 'texconnect_cache_';
  private readonly OFFLINE_PREFIX = 'texconnect_offline_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly OFFLINE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupOnlineListener();
    this.loadCacheFromStorage();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('✅ Application is online');
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('⚠️ Application is offline');
      this.isOnline = false;
    });
  }

  /**
   * Check if application is online
   */
  isApplicationOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('⚠️ Failed to store cache in localStorage:', error);
    }
  }

  /**
   * Clear specific cache
   */
  clear(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    
    // Clear all cache from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          const cacheKey = key.replace(this.CACHE_PREFIX, '');
          this.cache.set(cacheKey, entry);
        } catch (error) {
          console.warn('⚠️ Failed to load cache from localStorage:', error);
        }
      }
    });
  }

  /**
   * Save offline data
   */
  saveOfflineData(data: Partial<OfflineData>): void {
    const offlineData: OfflineData = {
      users: data.users || [],
      products: data.products || [],
      orders: data.orders || [],
      inventory: data.inventory || [],
      feedback: data.feedback || [],
      issues: data.issues || [],
      lastSync: Date.now()
    };

    try {
      localStorage.setItem(
        `${this.OFFLINE_PREFIX}data`,
        JSON.stringify(offlineData)
      );
      console.log('✅ Offline data saved');
    } catch (error) {
      console.error('❌ Failed to save offline data:', error);
    }
  }

  /**
   * Get offline data
   */
  getOfflineData(): OfflineData | null {
    try {
      const data = localStorage.getItem(`${this.OFFLINE_PREFIX}data`);
      if (!data) return null;

      const offlineData = JSON.parse(data) as OfflineData;
      
      // Check if offline data is still valid (24 hours)
      if (Date.now() - offlineData.lastSync > this.OFFLINE_TTL) {
        console.warn('⚠️ Offline data expired');
        return null;
      }

      return offlineData;
    } catch (error) {
      console.error('❌ Failed to get offline data:', error);
      return null;
    }
  }

  /**
   * Clear offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem(`${this.OFFLINE_PREFIX}data`);
  }

  /**
   * Sync offline data when back online
   */
  private async syncOfflineData(): Promise<void> {
    console.log('🔄 Syncing offline data...');
    // This will be called when application comes back online
    // Implementation depends on your backend
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    cachedKeys: string[];
    offlineDataAvailable: boolean;
  } {
    return {
      cacheSize: this.cache.size,
      cachedKeys: Array.from(this.cache.keys()),
      offlineDataAvailable: this.getOfflineData() !== null
    };
  }
}

export const cacheService = CacheService.getInstance();
export default cacheService;
