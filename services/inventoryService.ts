import type { Product, Order } from '../types';
import { supabase } from '../src/lib/supabase';

export interface StockUpdateResult {
  success: boolean;
  newStock: number;
  error?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  totalInitialStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  stockUtilization: number; // percentage
}

export class InventoryService {
  /**
   * Approve a buyer user (for debugging purposes)
   * @param buyerId - Buyer's user ID
   * @returns Promise<boolean>
   */
  static async approveBuyer(buyerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ isapproved: true, approvedat: new Date().toISOString(), approvedby: 'system' })
        .eq('id', buyerId);
      if (error) throw error;
      console.log('✅ Buyer approved:', buyerId);
      return true;
    } catch (error) {
      console.error('❌ Error approving buyer:', error);
      return false;
    }
  }
  /**
   * Place an order and automatically reduce stock
   * @param productId - The product ID
   * @param quantity - Quantity to order
   * @param buyerId - Buyer's user ID
   * @param buyerName - Buyer's name
   * @param buyerGst - Buyer's GST number
   * @returns Promise<StockUpdateResult>
   */
  static async placeOrderWithStockUpdate(
    productId: string,
    quantity: number,
    buyerId: string,
    buyerName: string,
    buyerGst?: string
  ): Promise<StockUpdateResult> {
    try {
      console.log('🛒 Placing order with stock update:', {
        productId,
        quantity,
        buyerId,
        buyerName,
        buyerGst
      });

      // 0. Verify buyer user exists and has correct role
      const { data: buyerData, error: buyerErr } = await supabase
        .from('users')
        .select('id, role, isapproved, email')
        .eq('id', buyerId)
        .single();
      if (buyerErr || !buyerData) throw new Error('Buyer user not found');
      if ((buyerData as any).role !== 'buyer') throw new Error('User is not a buyer');
      if (!(buyerData as any).isapproved) {
        const approved = await this.approveBuyer(buyerId);
        if (!approved) throw new Error('Buyer user is not approved and could not be approved');
      }

      // 1. Get the product to check current stock
      const { data: productData, error: productErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (productErr || !productData) throw new Error('Product not found');
      const currentStock = (productData as any).stock || 0;
      const initialStock = (productData as any).initialstock ?? (productData as any).stock;

      // 2. Check if there's enough stock
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // 3. Attempt to decrement stock atomically by filtering on stock >= quantity
      const newStock = currentStock - quantity;
      const { data: updatedProducts, error: updateErr } = await supabase
        .from('products')
        .update({ stock: newStock, updatedat: new Date().toISOString(), initialstock: Math.max(initialStock, newStock) })
        .eq('id', productId)
        .gte('stock', quantity)
        .select('*');
      if (updateErr) throw updateErr;
      if (!updatedProducts || updatedProducts.length === 0) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // 4. Create the order (use camelCase to match database)
      const orderPayload: any = {
        buyerId: buyerId,
        buyerName: buyerName,
        buyerGst: buyerGst,
        status: 'Pending',
        total: ((productData as any).price || 0) * quantity,
        date: new Date().toISOString(),
        items: [{ productId, quantity }]
      };
      const { error: orderErr } = await supabase.from('orders').insert(orderPayload);
      if (orderErr) throw orderErr;

      console.log('✅ Order placed and stock updated successfully:', {
        newStock,
        quantity
      });

      return {
        success: true,
        newStock
      };

    } catch (error) {
      console.error('❌ Error placing order:', error);
      console.error('Error details:', {
        productId,
        quantity,
        buyerId,
        buyerName,
        errorCode: (error as any)?.code,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack
      });
      return {
        success: false,
        newStock: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get inventory statistics for an MSME user
   * @param msmeId - MSME user ID
   * @returns Promise<InventoryStats>
   */
  static async getInventoryStats(msmeId: string): Promise<InventoryStats> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('msmeid', msmeId);
      if (error) throw error;

      let totalProducts = 0;
      let totalStock = 0;
      let totalInitialStock = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      (products || []).forEach((data: any) => {
        totalProducts++;
        totalStock += data.stock || 0;
        totalInitialStock += data.initialstock ?? data.stock ?? 0;

        // Check for low stock (below 10% of initial stock)
        const initialStock = data.initialstock ?? data.stock ?? 0;
        const stockPercentage = initialStock > 0 ? ((data.stock || 0) / initialStock) * 100 : 0;

        if ((data.stock || 0) === 0) {
          outOfStockProducts++;
        } else if (stockPercentage <= 10) {
          lowStockProducts++;
        }
      });

      const stockUtilization = totalInitialStock > 0 
        ? ((totalInitialStock - totalStock) / totalInitialStock) * 100 
        : 0;

      return {
        totalProducts,
        totalStock,
        totalInitialStock,
        lowStockProducts,
        outOfStockProducts,
        stockUtilization: Math.round(stockUtilization * 100) / 100
      };

    } catch (error) {
      console.error('❌ Error getting inventory stats:', error);
      throw error;
    }
  }

  /**
   * Get products with low stock alerts
   * @param msmeId - MSME user ID
   * @param threshold - Stock threshold percentage (default: 10%)
   * @returns Promise<Product[]>
   */
  static async getLowStockProducts(msmeId: string, threshold: number = 10): Promise<Product[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('msmeid', msmeId);
      if (error) throw error;

      const results: Product[] = [] as any;
      (products || []).forEach((data: any) => {
        const initialStock = data.initialstock ?? data.stock ?? 0;
        const stock = data.stock ?? 0;
        const stockPercentage = initialStock > 0 ? (stock / initialStock) * 100 : 0;
        if (stockPercentage <= threshold && stock > 0) {
          results.push({
            id: data.id,
            name: data.name,
            stock: stock,
            price: data.price,
            initialStock: initialStock,
            msmeId: data.msmeid,
          } as Product);
        }
      });

      return results;

    } catch (error) {
      console.error('❌ Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Restock a product
   * @param productId - Product ID
   * @param additionalStock - Additional stock to add
   * @param msmeId - MSME user ID (for security)
   * @returns Promise<StockUpdateResult>
   */
  static async restockProduct(
    productId: string,
    additionalStock: number,
    msmeId: string
  ): Promise<StockUpdateResult> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      if (error || !product) throw new Error('Product not found');

      if ((product as any).msmeid !== msmeId) {
        throw new Error('Unauthorized: You can only restock your own products');
      }

      const currentStock = (product as any).stock || 0;
      const currentInitial = (product as any).initialstock ?? currentStock;
      const newStock = currentStock + additionalStock;
      const newInitialStock = Math.max(currentInitial, newStock);

      const { error: upErr } = await supabase
        .from('products')
        .update({ stock: newStock, initialstock: newInitialStock, updatedat: new Date().toISOString() })
        .eq('id', productId)
        .eq('msmeid', msmeId);
      if (upErr) throw upErr;

      console.log('✅ Product restocked successfully:', {
        productId,
        additionalStock,
        newStock,
        newInitialStock
      });

      return {
        success: true,
        newStock
      };

    } catch (error) {
      console.error('❌ Error restocking product:', error);
      return {
        success: false,
        newStock: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a product has sufficient stock for an order
   * @param productId - Product ID
   * @param quantity - Required quantity
   * @returns Promise<boolean>
   */
  static async checkStockAvailability(productId: string, quantity: number): Promise<boolean> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      if (error || !product) return false;
      return ((product as any).stock || 0) >= quantity;

    } catch (error) {
      console.error('❌ Error checking stock availability:', error);
      return false;
    }
  }
}
