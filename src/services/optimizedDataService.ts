/**
 * Optimized Data Service
 * Handles efficient data fetching with caching and pagination
 */

import { supabase } from '../lib/supabase';
import cacheService from './cacheService';

interface FetchOptions {
  useCache?: boolean;
  cacheTTL?: number;
  limit?: number;
  offset?: number;
  select?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

class OptimizedDataService {
  private static instance: OptimizedDataService;
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;

  private constructor() {}

  static getInstance(): OptimizedDataService {
    if (!OptimizedDataService.instance) {
      OptimizedDataService.instance = new OptimizedDataService();
    }
    return OptimizedDataService.instance;
  }

  /**
   * Fetch users with optimization
   */
  async fetchUsers(options: FetchOptions = {}): Promise<any[]> {
    const {
      useCache = true,
      cacheTTL = 5 * 60 * 1000,
      select = '*'
    } = options;

    const cacheKey = `users_${select}`;

    // Check cache first
    if (useCache && cacheService.isApplicationOnline()) {
      const cached = cacheService.get<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Users from cache');
        return cached;
      }
    }

    // Check offline data
    if (!cacheService.isApplicationOnline()) {
      const offlineData = cacheService.getOfflineData();
      if (offlineData?.users) {
        console.log('📱 Users from offline storage');
        return offlineData.users;
      }
    }

    try {
      console.log('🔄 Fetching users from Supabase...');
      const { data, error } = await supabase
        .from('users')
        .select(select)
        .limit(1000);

      if (error) throw error;

      if (data) {
        cacheService.set(cacheKey, data, cacheTTL);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Fetch products with pagination and optimization
   */
  async fetchProducts(
    options: FetchOptions & { msmeid?: string } = {}
  ): Promise<PaginatedResult<any>> {
    const {
      useCache = true,
      cacheTTL = 5 * 60 * 1000,
      limit = this.DEFAULT_PAGE_SIZE,
      offset = 0,
      select = '*',
      msmeid
    } = options;

    const pageSize = Math.min(limit, this.MAX_PAGE_SIZE);
    const page = Math.floor(offset / pageSize) + 1;
    const cacheKey = `products_${msmeid || 'all'}_${page}`;

    // Check cache first
    if (useCache && cacheService.isApplicationOnline()) {
      const cached = cacheService.get<PaginatedResult<any>>(cacheKey);
      if (cached) {
        console.log('📦 Products from cache (page', page, ')');
        return cached;
      }
    }

    // Check offline data
    if (!cacheService.isApplicationOnline()) {
      const offlineData = cacheService.getOfflineData();
      if (offlineData?.products) {
        console.log('📱 Products from offline storage');
        const filtered = msmeid
          ? offlineData.products.filter((p: any) => p.msmeid === msmeid)
          : offlineData.products;
        
        return {
          data: filtered.slice(offset, offset + pageSize),
          total: filtered.length,
          hasMore: offset + pageSize < filtered.length,
          page,
          pageSize
        };
      }
    }

    try {
      console.log('🔄 Fetching products from Supabase (page', page, ')...');
      
      let query = supabase.from('products').select(select, { count: 'exact' });
      
      if (msmeid) {
        query = query.eq('msmeid', msmeid);
      }

      const { data, error, count } = await query
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      const result: PaginatedResult<any> = {
        data: data || [],
        total: count || 0,
        hasMore: (offset + pageSize) < (count || 0),
        page,
        pageSize
      };

      cacheService.set(cacheKey, result, cacheTTL);
      return result;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Fetch orders with optimization
   */
  async fetchOrders(
    options: FetchOptions & { buyerid?: string; status?: string } = {}
  ): Promise<any[]> {
    const {
      useCache = true,
      cacheTTL = 3 * 60 * 1000, // 3 minutes for orders (more dynamic)
      select = '*',
      buyerid,
      status
    } = options;

    const cacheKey = `orders_${buyerid || 'all'}_${status || 'all'}`;

    // Check cache first
    if (useCache && cacheService.isApplicationOnline()) {
      const cached = cacheService.get<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Orders from cache');
        return cached;
      }
    }

    // Check offline data
    if (!cacheService.isApplicationOnline()) {
      const offlineData = cacheService.getOfflineData();
      if (offlineData?.orders) {
        console.log('📱 Orders from offline storage');
        let filtered = offlineData.orders;
        if (buyerid) filtered = filtered.filter((o: any) => o.buyerId === buyerid);
        if (status) filtered = filtered.filter((o: any) => o.status === status);
        return filtered;
      }
    }

    try {
      console.log('🔄 Fetching orders from Supabase...');
      
      let query = supabase.from('orders').select(select);
      
      if (buyerid) {
        query = query.eq('buyerId', buyerid);
      }
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      if (data) {
        cacheService.set(cacheKey, data, cacheTTL);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Fetch inventory with optimization
   */
  async fetchInventory(
    options: FetchOptions & { msmeid?: string } = {}
  ): Promise<any[]> {
    const {
      useCache = true,
      cacheTTL = 5 * 60 * 1000,
      select = '*',
      msmeid
    } = options;

    const cacheKey = `inventory_${msmeid || 'all'}`;

    // Check cache first
    if (useCache && cacheService.isApplicationOnline()) {
      const cached = cacheService.get<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Inventory from cache');
        return cached;
      }
    }

    // Check offline data
    if (!cacheService.isApplicationOnline()) {
      const offlineData = cacheService.getOfflineData();
      if (offlineData?.inventory) {
        console.log('📱 Inventory from offline storage');
        const filtered = msmeid
          ? offlineData.inventory.filter((i: any) => i.msmeid === msmeid)
          : offlineData.inventory;
        return filtered;
      }
    }

    try {
      console.log('🔄 Fetching inventory from Supabase...');
      
      let query = supabase.from('inventory').select(select);
      
      if (msmeid) {
        query = query.eq('msmeid', msmeid);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      if (data) {
        cacheService.set(cacheKey, data, cacheTTL);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      throw error;
    }
  }

  /**
   * Batch fetch multiple data types
   */
  async batchFetch(options: {
    users?: boolean;
    products?: boolean;
    orders?: boolean;
    inventory?: boolean;
    msmeid?: string;
    buyerid?: string;
  } = {}): Promise<{
    users: any[];
    products: any[];
    orders: any[];
    inventory: any[];
  }> {
    const {
      users = true,
      products = true,
      orders = true,
      inventory = true,
      msmeid,
      buyerid
    } = options;

    console.log('🔄 Batch fetching data...');

    const promises = [];

    if (users) {
      promises.push(this.fetchUsers({ useCache: true }));
    }

    if (products) {
      promises.push(this.fetchProducts({ useCache: true, msmeid }));
    }

    if (orders) {
      promises.push(this.fetchOrders({ useCache: true, buyerid }));
    }

    if (inventory) {
      promises.push(this.fetchInventory({ useCache: true, msmeid }));
    }

    const results = await Promise.all(promises);

    return {
      users: users ? (results[0] as any[]) : [],
      products: products ? (results[users ? 1 : 0] as any) : { data: [] },
      orders: orders ? (results[(users ? 1 : 0) + (products ? 1 : 0)] as any[]) : [],
      inventory: inventory ? (results[(users ? 1 : 0) + (products ? 1 : 0) + (orders ? 1 : 0)] as any[]) : []
    };
  }

  /**
   * Prefetch data for better performance
   */
  async prefetchData(msmeid?: string, buyerid?: string): Promise<void> {
    console.log('⚡ Prefetching data...');
    
    try {
      await Promise.all([
        this.fetchUsers({ useCache: true }),
        this.fetchProducts({ useCache: true, msmeid }),
        this.fetchOrders({ useCache: true, buyerid }),
        this.fetchInventory({ useCache: true, msmeid })
      ]);

      console.log('✅ Data prefetch complete');
    } catch (error) {
      console.error('⚠️ Error during prefetch:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    cacheService.clearAll();
    console.log('✅ All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return cacheService.getStats();
  }
}

export const optimizedDataService = OptimizedDataService.getInstance();
export default optimizedDataService;
