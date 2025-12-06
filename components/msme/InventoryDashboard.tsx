import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { useTranslate } from '../../hooks/useTranslator';
import type { Product } from '../../types';
import { InventoryService, type InventoryStats } from '../../services/inventoryService';
import { supabase } from '../../src/lib/supabase';
import InventoryProgressBar from '../common/InventoryProgressBar';
import Modal from '../common/Modal';

// Component for translated product name
const TranslatedProductName: React.FC<{ name: string; className?: string }> = React.memo(({ name, className }) => {
  const translatedName = useTranslate(name);
  return <span className={className}>{translatedName}</span>;
});

interface InventoryDashboardProps {
  onAddProduct?: () => void;
}

interface InventoryFormData {
  name: string;
  category: string;
  description: string;
  stock: number;
  price: number;
  unitOfMeasure: string;
  minStockLevel: number;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ onAddProduct }) => {
  const { t } = useLocalization();
  const { products, currentUser, addInventoryItem, inventory } = useAppContext();
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    category: '',
    description: '',
    stock: 0,
    price: 0,
    unitOfMeasure: '',
    minStockLevel: 0
  });

  // Filter inventory items for current MSME user
  const msmeProducts = useMemo(() => {
    if (!currentUser) {
      console.log('❌ InventoryDashboard: No current user');
      return [];
    }
    const filtered = inventory.filter((item: any) => (item.msmeId || item.msmeid) === currentUser.id);
    console.log('📦 InventoryDashboard: Filtered inventory items:', filtered.length, 'out of', inventory.length);
    console.log('📦 InventoryDashboard: Inventory items:', filtered.map(p => ({ id: p.id, name: p.name, stock: p.stock })));
    return filtered;
  }, [inventory, currentUser]);

  // Load inventory statistics
  useEffect(() => {
    const loadInventoryStats = async () => {
      if (!currentUser || currentUser.role !== 'msme') {
        console.log('❌ No current user or not MSME:', { currentUser: currentUser?.role });
        return;
      }

      console.log('🔄 Loading inventory stats for MSME:', currentUser.id);
      console.log('📦 Available products:', products.length);

      try {
        setIsLoading(true);
        const [stats, lowStock] = await Promise.all([
          InventoryService.getInventoryStats(currentUser.id),
          InventoryService.getLowStockProducts(currentUser.id, 10)
        ]);
        
        console.log('📊 Inventory stats loaded:', stats);
        console.log('⚠️ Low stock products:', lowStock.length);
        
        setInventoryStats(stats);
        setLowStockProducts(lowStock);
      } catch (error) {
        console.error('❌ Error loading inventory stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInventoryStats();
  }, [currentUser, products]);

  // Realtime: refresh stats when products change for this MSME
  useEffect(() => {
    if (!currentUser) return;

    const reload = async () => {
      try {
        const [stats, lowStock] = await Promise.all([
          InventoryService.getInventoryStats(currentUser.id),
          InventoryService.getLowStockProducts(currentUser.id, 10)
        ]);
        setInventoryStats(stats);
        setLowStockProducts(lowStock);
      } catch (e) {
        console.error('❌ Error refreshing inventory stats (realtime):', e);
      }
    };

    const channel = supabase
      .channel(`inv-msme-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory', filter: `msmeid=eq.${currentUser.id}` },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity(0);
    setIsRestockModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'price' || name === 'minStockLevel' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addInventoryItem({
        ...formData,
        msmeId: currentUser.id,
        status: 'active',
        reserved: 0,
        bought: 0
      });
      
      alert('Inventory item added successfully!');
      setIsAddInventoryModalOpen(false);
      setFormData({
        name: '',
        category: '',
        description: '',
        stock: 0,
        price: 0,
        unitOfMeasure: '',
        minStockLevel: 0
      });
      
      // Refresh inventory stats
      const [stats, lowStock] = await Promise.all([
        InventoryService.getInventoryStats(currentUser.id),
        InventoryService.getLowStockProducts(currentUser.id, 10)
      ]);
      setInventoryStats(stats);
      setLowStockProducts(lowStock);
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = useCallback(async () => {
    if (!selectedProduct || !currentUser || restockQuantity <= 0) return;

    try {
      const result = await InventoryService.restockProduct(
        selectedProduct.id,
        restockQuantity,
        currentUser.id
      );

      if (result.success) {
        alert(`Product restocked successfully! New stock: ${result.newStock}`);
        setIsRestockModalOpen(false);
        setSelectedProduct(null);
        setRestockQuantity(0);
        
        // Trigger data refresh without page reload
        const [stats, lowStock] = await Promise.all([
          InventoryService.getInventoryStats(currentUser.id),
          InventoryService.getLowStockProducts(currentUser.id, 10)
        ]);
        setInventoryStats(stats);
        setLowStockProducts(lowStock);
      } else {
        alert(`Error restocking: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      alert('Error restocking product');
    }
  }, [selectedProduct, currentUser, restockQuantity]);

  const getStockStatusColor = (product: Product) => {
    const initialStock = product.initialStock || product.stock;
    const stockPercentage = initialStock > 0 ? (product.stock / initialStock) * 100 : 0;
    
    if (product.stock === 0) return 'text-red-600 bg-red-50';
    if (stockPercentage <= 10) return 'text-yellow-600 bg-yellow-50';
    if (stockPercentage <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = (product: Product) => {
    const initialStock = product.initialStock || product.stock;
    const stockPercentage = initialStock > 0 ? (product.stock / initialStock) * 100 : 0;
    
    if (product.stock === 0) return 'Out of Stock';
    if (stockPercentage <= 10) return 'Critical';
    if (stockPercentage <= 30) return 'Low';
    return 'Good';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading inventory data...</p>
          <p className="text-xs text-slate-500 mt-2">This may take a few seconds...</p>
        </div>
      </div>
    );
  }

  if (!inventoryStats) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Unable to load inventory statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{inventoryStats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Current Stock</p>
              <p className="text-2xl font-bold text-slate-900">{inventoryStats.totalStock.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-slate-900">{inventoryStats.lowStockProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Out of Stock</p>
              <p className="text-2xl font-bold text-slate-900">{inventoryStats.outOfStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Utilization Progress */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Stock Utilization</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Overall Stock Usage</span>
            <span className="font-medium text-slate-900">{inventoryStats.stockUtilization}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(inventoryStats.stockUtilization, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {inventoryStats.totalInitialStock - inventoryStats.totalStock} of {inventoryStats.totalInitialStock} units sold
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-slate-900">
                    <TranslatedProductName name={product.name} />
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}>
                    {getStockStatusText(product)}
                  </span>
                </div>
                <InventoryProgressBar
                  currentStock={product.stock}
                  initialStock={product.initialStock || product.stock}
                  size="sm"
                  showNumbers={true}
                />
                <button
                  onClick={() => handleRestock(product)}
                  className="mt-3 w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products Inventory */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">All Products Inventory</h3>
          <button
            onClick={() => setIsAddInventoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Add Product
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {msmeProducts.map(product => (
            <div key={product.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-slate-900">
                  <TranslatedProductName name={product.name} />
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}>
                  {getStockStatusText(product)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-medium">₹{product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Initial Stock:</span>
                  <span className="font-medium">{(product.initialStock || product.stock).toLocaleString()}</span>
                </div>
              </div>

              <InventoryProgressBar
                currentStock={product.stock}
                initialStock={product.initialStock || product.stock}
                size="sm"
                showNumbers={true}
              />

              <button
                onClick={() => handleRestock(product)}
                className="mt-3 w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
              >
                Restock
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Inventory Modal */}
      <Modal isOpen={isAddInventoryModalOpen} onClose={() => setIsAddInventoryModalOpen(false)} title="Add Product to Inventory">
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleAddInventory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Yarn, Fabric, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Raw Material, Finished Goods"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Price per Unit (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Unit of Measure *</label>
                <input
                  type="text"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="e.g., Kg, Meter, Piece"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Minimum Stock Level *</label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsAddInventoryModalOpen(false)}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add to Inventory'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title="Restock Product">
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">{selectedProduct.name}</h3>
              <p className="text-sm text-slate-600">Current Stock: {selectedProduct.stock.toLocaleString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Stock Quantity
              </label>
              <input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter quantity to add"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockSubmit}
                disabled={restockQuantity <= 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Restock
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryDashboard;
