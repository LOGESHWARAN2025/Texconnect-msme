/**
 * Production Planning Service
 * Handles production orders, work orders, and batch management
 */

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  product: string;
  quantity: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  materials: MaterialRequirement[];
  workOrders: WorkOrder[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  allocated: number;
  used: number;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  productionOrderId: string;
  operation: string;
  sequence: number;
  status: 'pending' | 'in_progress' | 'completed';
  startDate: Date;
  endDate: Date;
  assignedTo: string;
  notes: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  productionOrderId: string;
  product: string;
  quantity: number;
  manufacturingDate: Date;
  expiryDate?: Date;
  status: 'active' | 'completed' | 'rejected';
  qualityCheck: QualityCheck;
}

export interface QualityCheck {
  status: 'pending' | 'passed' | 'failed';
  checkedBy: string;
  checkedDate?: Date;
  notes: string;
}

export interface ReorderAlert {
  id: string;
  materialId: string;
  materialName: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  supplier: string;
  alertDate: Date;
  status: 'active' | 'ordered' | 'resolved';
}

class ProductionService {
  private apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  /**
   * Create production order
   */
  async createProductionOrder(order: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductionOrder> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (!response.ok) throw new Error('Failed to create production order');
      return response.json();
    } catch (error) {
      console.error('Error creating production order:', error);
      throw error;
    }
  }

  /**
   * Get production orders
   */
  async getProductionOrders(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ProductionOrder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(
        `${this.apiBaseUrl}/api/production/orders?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch production orders');
      return response.json();
    } catch (error) {
      console.error('Error fetching production orders:', error);
      throw error;
    }
  }

  /**
   * Get production order by ID
   */
  async getProductionOrderById(id: string): Promise<ProductionOrder> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/orders/${id}`);

      if (!response.ok) throw new Error('Failed to fetch production order');
      return response.json();
    } catch (error) {
      console.error('Error fetching production order:', error);
      throw error;
    }
  }

  /**
   * Update production order
   */
  async updateProductionOrder(
    id: string,
    updates: Partial<ProductionOrder>
  ): Promise<ProductionOrder> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update production order');
      return response.json();
    } catch (error) {
      console.error('Error updating production order:', error);
      throw error;
    }
  }

  /**
   * Delete production order
   */
  async deleteProductionOrder(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete production order');
    } catch (error) {
      console.error('Error deleting production order:', error);
      throw error;
    }
  }

  /**
   * Create work order
   */
  async createWorkOrder(
    productionOrderId: string,
    workOrder: Omit<WorkOrder, 'id'>
  ): Promise<WorkOrder> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/production/orders/${productionOrderId}/work-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workOrder),
        }
      );

      if (!response.ok) throw new Error('Failed to create work order');
      return response.json();
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  }

  /**
   * Update work order status
   */
  async updateWorkOrderStatus(
    productionOrderId: string,
    workOrderId: string,
    status: WorkOrder['status']
  ): Promise<WorkOrder> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/production/orders/${productionOrderId}/work-orders/${workOrderId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update work order');
      return response.json();
    } catch (error) {
      console.error('Error updating work order:', error);
      throw error;
    }
  }

  /**
   * Create batch
   */
  async createBatch(batch: Omit<Batch, 'id'>): Promise<Batch> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      if (!response.ok) throw new Error('Failed to create batch');
      return response.json();
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Get batches
   */
  async getBatches(productionOrderId?: string): Promise<Batch[]> {
    try {
      const params = new URLSearchParams();
      if (productionOrderId) params.append('productionOrderId', productionOrderId);

      const response = await fetch(
        `${this.apiBaseUrl}/api/production/batches?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw error;
    }
  }

  /**
   * Quality check batch
   */
  async qualityCheckBatch(
    batchId: string,
    qualityCheck: QualityCheck
  ): Promise<Batch> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/production/batches/${batchId}/quality-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qualityCheck),
        }
      );

      if (!response.ok) throw new Error('Failed to perform quality check');
      return response.json();
    } catch (error) {
      console.error('Error performing quality check:', error);
      throw error;
    }
  }

  /**
   * Get reorder alerts
   */
  async getReorderAlerts(): Promise<ReorderAlert[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/reorder-alerts`);

      if (!response.ok) throw new Error('Failed to fetch reorder alerts');
      return response.json();
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
      throw error;
    }
  }

  /**
   * Create purchase order from reorder alert
   */
  async createPurchaseOrderFromAlert(alertId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/production/reorder-alerts/${alertId}/create-po`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to create purchase order');
      return response.json();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Calculate material requirements
   */
  calculateMaterialRequirements(
    productionQuantity: number,
    billOfMaterials: any[]
  ): MaterialRequirement[] {
    return billOfMaterials.map((material) => ({
      materialId: material.id,
      materialName: material.name,
      requiredQuantity: material.quantityPerUnit * productionQuantity,
      unit: material.unit,
      allocated: 0,
      used: 0,
    }));
  }

  /**
   * Get production dashboard metrics
   */
  async getProductionMetrics(): Promise<{
    totalOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    pendingAlerts: number;
    averageCompletionTime: number;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/production/metrics`);

      if (!response.ok) throw new Error('Failed to fetch production metrics');
      return response.json();
    } catch (error) {
      console.error('Error fetching production metrics:', error);
      throw error;
    }
  }

  /**
   * Generate production report
   */
  async generateProductionReport(filters: {
    startDate: Date;
    endDate: Date;
    status?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate.toISOString());
      params.append('endDate', filters.endDate.toISOString());
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(
        `${this.apiBaseUrl}/api/production/reports?${params.toString()}`
      );

      if (!response.ok) throw new Error('Failed to generate production report');
      return response.json();
    } catch (error) {
      console.error('Error generating production report:', error);
      throw error;
    }
  }
}

export default new ProductionService();
