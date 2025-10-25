import { Order, Product } from '../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../src/lib/supabase';

// Helper functions for data formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

interface FormattedSalesTrend {
  date: string;
  sales: number;
  formattedSales: string;
  growthRate: number;
}

interface FormattedStockLevel {
  name: string;
  stock: number;
  minStockLevel: number;
  status: 'critical' | 'low' | 'normal';
  stockValue: number;
  formattedStockValue: string;
  daysUntilStockout: number;
}

export const getDailySalesTrends = async (msmeId: string, days: number = 30): Promise<FormattedSalesTrend[]> => {
  try {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(new Date(), days));

    // First, get all products for this MSME
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('msmeid', msmeId);

    if (productsError) throw productsError;

    const msmeProductIds = new Set((productsData || []).map((p: any) => p.id));

    // Fetch orders within date range and Delivered status
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Delivered')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString());

    if (ordersError) throw ordersError;

  const salesByDay = new Map<string, number>();
  
  // Initialize all dates in the range with 0 sales
  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    salesByDay.set(date, 0);
  }

    // Filter orders that contain MSME products and calculate sales
    const limited = (ordersData || []).slice(0, 1000);
    for (const order of limited as any[]) {
      const items = order.items || [];
      let orderTotal = 0;
      
      // Calculate total for items belonging to this MSME
      for (const item of items) {
        const productId = item.productId || item.productid;
        if (msmeProductIds.has(productId)) {
          orderTotal += (item.quantity || 0) * (item.price || 0);
        }
      }
      
      if (orderTotal > 0) {
        const orderDateStr = format(new Date(order.createdat || order.date), 'yyyy-MM-dd');
        const currentTotal = salesByDay.get(orderDateStr) || 0;
        salesByDay.set(orderDateStr, currentTotal + orderTotal);
      }
    }

  // Convert to array and calculate growth rates
  const entries = Array.from(salesByDay.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  const salesTrends: FormattedSalesTrend[] = entries.map((entry, index) => {
    const [date, sales] = entry;
    const previousSales = index > 0 ? entries[index - 1][1] : sales;
    
    return {
      date,
      sales,
      formattedSales: formatCurrency(sales),
      growthRate: calculateGrowthRate(sales, previousSales)
    };
  });

    return salesTrends;
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return [];
  }
};

export const getStockLevelTrends = async (msmeId: string): Promise<FormattedStockLevel[]> => {
  try {
    // Get current products for this MSME
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('msmeid', msmeId);

    if (productsError) throw productsError;

    // Get recent orders to calculate average daily usage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('*')
      .gte('createdat', thirtyDaysAgo.toISOString());

    if (recentOrdersError) throw recentOrdersError;

    // Calculate average daily usage per item with iteration limits
    const dailyUsage = new Map<string, number>();
    const limitedOrders = (recentOrders || []).slice(0, 1000) as any[];
    for (const order of limitedOrders) {
      const items = order.items || [];
      const maxItems = Math.min(items.length, 100);
      for (let j = 0; j < maxItems; j++) {
        const item = items[j];
        const productId = item.productId || item.productid || item.itemid;
        const currentUsage = dailyUsage.get(productId) || 0;
        dailyUsage.set(productId, currentUsage + (item.quantity || 0));
      }
    }

  const stockLevels = (productsData || []).map((product: any) => {
    const avgDailyUsage = (dailyUsage.get(product.id) || 0) / 30; // Average over 30 days
    const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(product.stock / avgDailyUsage) : 999;
    const minStockLevel = Math.floor((product.initialStock || product.stock) * 0.1); // 10% of initial stock as minimum
    
    return {
      name: product.name,
      stock: product.stock,
      minStockLevel,
      status: (daysUntilStockout <= 7 ? 'critical' : 
             product.stock <= minStockLevel ? 'low' : 'normal') as 'critical' | 'low' | 'normal',
      stockValue: product.stock * product.price,
      formattedStockValue: formatCurrency(product.stock * product.price),
      daysUntilStockout
    };
  });

    return stockLevels.sort((a, b) => {
      // Sort by status priority (critical first, then low, then normal)
      const statusPriority = { critical: 0, low: 1, normal: 2 };
      return statusPriority[a.status] - statusPriority[b.status] || a.stock - b.stock;
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return [];
  }
};

export const subscribeToInventoryUpdates = (
  msmeId: string,
  callback: (stockLevels: FormattedStockLevel[]) => void
) => {
  // Helper to compute and push current stock levels
  const computeAndCallback = async () => {
    const levels = await getStockLevelTrends(msmeId);
    callback(levels);
  };

  // Initial fetch
  computeAndCallback();

  // Realtime subscribe to products table changes for this MSME
  const channel = supabase
    .channel(`products-msme-${msmeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products', filter: `msmeid=eq.${msmeId}` },
      () => {
        computeAndCallback();
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};
