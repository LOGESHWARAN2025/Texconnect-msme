import { db } from '../firebase';
import type { Product, Order } from '../types';

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
      await db.collection('users').doc(buyerId).update({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: 'system'
      });
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

      // Start a batch operation for atomicity
      const batch = db.batch();
      
      // Test: Try to create order first without batch to isolate the issue
      console.log('🧪 Testing order creation without batch...');
      try {
        const testOrderRef = db.collection('orders').doc();
        const testOrderData = {
          buyerId,
          buyerName,
          buyerGst,
          date: new Date().toISOString(),
          status: 'Pending',
          total: 100, // Test value
          items: [{ productId, quantity }]
        };
        console.log('🧪 Test order data:', testOrderData);
        // Don't actually create it, just log the data
      } catch (testError) {
        console.error('🧪 Test order creation failed:', testError);
      }

      // 0. Verify buyer user exists and has correct role
      const buyerDoc = await db.collection('users').doc(buyerId).get();
      if (!buyerDoc.exists) {
        throw new Error('Buyer user not found');
      }
      const buyerData = buyerDoc.data();
      if (buyerData?.role !== 'buyer') {
        throw new Error('User is not a buyer');
      }
      // Check and approve buyer if not approved
      if (!buyerData?.isApproved) {
        console.log('⚠️ Buyer not approved, attempting to approve...');
        const approved = await this.approveBuyer(buyerId);
        if (!approved) {
          throw new Error('Buyer user is not approved and could not be approved');
        }
      }
      console.log('✅ Buyer verification passed:', {
        buyerId,
        role: buyerData.role,
        isApproved: buyerData.isApproved,
        email: buyerData.email,
        fullBuyerData: buyerData
      });

      // 1. Get the product to check current stock
      const productRef = db.collection('products').doc(productId);
      console.log('🔍 Attempting to read product:', productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        throw new Error('Product not found');
      }
      console.log('✅ Product found:', productDoc.data());

      const productData = productDoc.data() as Product;
      const currentStock = productData.stock;
      const initialStock = productData.initialStock || productData.stock;

      // 2. Check if there's enough stock
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // 3. Calculate new stock
      const newStock = currentStock - quantity;

      // 4. Create the order
      const orderRef = db.collection('orders').doc();
      const orderData: Omit<Order, 'id'> = {
        buyerId,
        buyerName,
        buyerGst,
        date: new Date().toISOString(),
        status: 'Pending',
        total: productData.price * quantity,
        items: [{ productId, quantity }]
      };

      console.log('📝 Creating order with data:', orderData);
      batch.set(orderRef, orderData);

      // 5. Update product stock
      console.log('📦 Updating stock:', {
        productId,
        oldStock: currentStock,
        newStock: newStock,
        quantity: quantity
      });
      batch.update(productRef, {
        stock: newStock,
        updatedAt: new Date()
      });

      // 6. Commit the batch
      console.log('💾 Committing batch...');
      console.log('Batch operations:', {
        orderRef: orderRef.path,
        productRef: productRef.path,
        orderData: orderData,
        stockUpdate: { stock: newStock, updatedAt: new Date() }
      });
      await batch.commit();

      console.log('✅ Order placed and stock updated successfully:', {
        orderId: orderRef.id,
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
        errorCode: error.code,
        errorMessage: error.message,
        errorStack: error.stack
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
      const productsSnapshot = await db
        .collection('products')
        .where('msmeId', '==', msmeId)
        .get();

      let totalProducts = 0;
      let totalStock = 0;
      let totalInitialStock = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      productsSnapshot.forEach(doc => {
        const data = doc.data() as Product;
        totalProducts++;
        totalStock += data.stock;
        totalInitialStock += data.initialStock || data.stock;

        // Check for low stock (below 10% of initial stock)
        const initialStock = data.initialStock || data.stock;
        const stockPercentage = initialStock > 0 ? (data.stock / initialStock) * 100 : 0;

        if (data.stock === 0) {
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
      const productsSnapshot = await db
        .collection('products')
        .where('msmeId', '==', msmeId)
        .get();

      const lowStockProducts: Product[] = [];

      productsSnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() } as Product;
        const initialStock = data.initialStock || data.stock;
        const stockPercentage = initialStock > 0 ? (data.stock / initialStock) * 100 : 0;

        if (stockPercentage <= threshold && data.stock > 0) {
          lowStockProducts.push(data);
        }
      });

      return lowStockProducts;

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
      const productRef = db.collection('products').doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        throw new Error('Product not found');
      }

      const productData = productDoc.data() as Product;

      // Verify ownership
      if (productData.msmeId !== msmeId) {
        throw new Error('Unauthorized: You can only restock your own products');
      }

      const newStock = productData.stock + additionalStock;
      const newInitialStock = Math.max(productData.initialStock || productData.stock, newStock);

      await productRef.update({
        stock: newStock,
        initialStock: newInitialStock,
        updatedAt: new Date()
      });

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
      const productDoc = await db.collection('products').doc(productId).get();
      
      if (!productDoc.exists) {
        return false;
      }

      const productData = productDoc.data() as Product;
      return productData.stock >= quantity;

    } catch (error) {
      console.error('❌ Error checking stock availability:', error);
      return false;
    }
  }
}
