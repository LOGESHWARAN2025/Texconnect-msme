import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Layers, AlertCircle, X, TrendingUp, Plus } from 'lucide-react';
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

      alert(t('inventory_item_added_success'));
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
      alert(`${t('error')}: ${error.message}`);
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
        alert(`${t('inventory_restocked_success')} ${t('new_stock')}: ${result.newStock}`);
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
        alert(`${t('error')}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      alert(t('error_restocking'));
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
          <p className="text-slate-600 font-bold">{t('loading_inventory_data')}</p>
          <p className="text-xs text-slate-500 mt-2">{t('this_may_take_seconds')}</p>
        </div>
      </div>
    );
  }

  if (!inventoryStats) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 font-bold">{t('unable_load_stats')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('total_products'), value: inventoryStats.totalProducts, icon: Box, color: 'from-blue-600 to-indigo-500', bg: 'bg-blue-50' },
          { label: t('current_stock'), value: inventoryStats.totalStock.toLocaleString(), icon: Layers, color: 'from-emerald-600 to-teal-500', bg: 'bg-green-50' },
          { label: t('low_stock_items'), value: inventoryStats.lowStockProducts, icon: AlertCircle, color: 'from-amber-600 to-orange-500', bg: 'bg-yellow-50' },
          { label: t('out_of_stock'), value: inventoryStats.outOfStockProducts, icon: X, color: 'from-rose-600 to-red-500', bg: 'bg-red-50' }
        ].map((card, idx) => (
          <div key={idx} className="group bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-7 border border-white/20 transition-all hover:-translate-y-2 hover:shadow-indigo-500/10">
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg shadow-current/20 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="ml-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Utilization Progress */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-white/20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            {t('stock_utilization')}
          </h3>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest border border-indigo-100">{t('live_data')}</span>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('overall_stock_usage')}</p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{inventoryStats.stockUtilization}%</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden shadow-inner p-1">
            <div
              className="bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${Math.min(inventoryStats.stockUtilization, 100)}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-900">{inventoryStats.totalInitialStock - inventoryStats.totalStock}</span>
            <span className="text-[10px] font-bold uppercase text-slate-400">{t('of')}</span>
            <span className="inline-flex items-center justify-center bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-900">{inventoryStats.totalInitialStock}</span>
            <span className="font-medium text-slate-400 ml-1">{t('units_utilized_message')}</span>
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-amber-100 shadow-2xl shadow-amber-500/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <AlertCircle className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight">{t('stock_alert')}</h3>
                <p className="text-sm text-amber-700 font-medium opacity-80">{t('restock_needed_immediately')}</p>
              </div>
            </div>
            <span className="px-5 py-2 bg-amber-200/50 text-amber-900 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-amber-300/50">{lowStockProducts.length} {t('items')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockProducts.map(product => (
              <div key={product.id} className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-amber-200/50 shadow-xl shadow-amber-900/5 transition-all hover:scale-[1.03] hover:shadow-2xl">
                <div className="flex justify-between items-start mb-5">
                  <h4 className="font-black text-slate-900 text-lg leading-tight">
                    <TranslatedProductName name={product.name} />
                  </h4>
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStockStatusColor(product)}`}>
                    {t(getStockStatusText(product).toLowerCase().replace(/ /g, '_'))}
                  </span>
                </div>
                <div className="mb-6">
                  <InventoryProgressBar
                    currentStock={product.stock}
                    initialStock={product.initialStock || product.stock}
                    size="md"
                    showNumbers={true}
                  />
                </div>
                <button
                  onClick={() => handleRestock(product)}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:shadow-orange-500/40 transition-all active:scale-95"
                >
                  {t('restock')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products Inventory */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('manage_inventory')}</h3>
            <p className="text-sm text-slate-500 font-medium">{t('view_update_catalog')}</p>
          </div>
          <button
            onClick={() => setIsAddInventoryModalOpen(true)}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            {t('add_new_item')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {msmeProducts.map(product => (
            <div key={product.id} className="group bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl shadow-slate-200/30 transition-all hover:shadow-2xl hover:border-indigo-100 hover:scale-[1.03]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 block opacity-70">{(product as any).category || 'General'}</span>
                  <h4 className="font-black text-slate-900 text-xl leading-none tracking-tight">
                    <TranslatedProductName name={product.name} />
                  </h4>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStockStatusColor(product as any)}`}>
                  {t(getStockStatusText(product as any).toLowerCase().replace(/ /g, '_'))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50/80 rounded-3xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-colors text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('price_per_unit')}</span>
                  <span className="font-black text-slate-900 text-lg">₹{product.price.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-3xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-colors text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('total_stock')}</span>
                  <span className="font-black text-slate-900 text-lg">{product.stock.toLocaleString()}</span>
                </div>
              </div>

              <div className="mb-8">
                <InventoryProgressBar
                  currentStock={product.stock}
                  initialStock={(product as any).initialStock || product.stock}
                  size="sm"
                  showNumbers={false}
                />
              </div>

              <button
                onClick={() => handleRestock(product as any)}
                className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black uppercase tracking-widest border border-slate-200 transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-xl active:scale-95"
              >
                {t('restock')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Inventory Modal */}
      <Modal isOpen={isAddInventoryModalOpen} onClose={() => setIsAddInventoryModalOpen(false)} title={t('add_new_item')}>
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleAddInventory} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('product_name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder={t('product_name_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('category')} *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder={t('category_placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('description')}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                placeholder={t('describe_your_product')}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('stock_quantity')} *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('price_per_unit')} *</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unit_of_measure')} *</label>
                <input
                  type="text"
                  name="unitOfMeasure"
                  value={formData.unitOfMeasure}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                  placeholder={t('uom_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('minimum_stock_level')} *</label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddInventoryModalOpen(false)}
                className="px-8 py-4 text-[13px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {isSubmitting ? t('adding') : t('add_new_item')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} title={t('restock_product')}>
        {selectedProduct && (
          <div className="space-y-8 p-2">
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <h3 className="text-xl font-black text-slate-900 mb-1">
                <TranslatedProductName name={selectedProduct.name} />
              </h3>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{t('current_stock')}: {selectedProduct.stock.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t('enter_quantity_add')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-2xl text-slate-900"
                  placeholder="0"
                  autoFocus
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase tracking-widest text-xs">{t('units')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleRestockSubmit}
                disabled={restockQuantity <= 0}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {t('confirm_restock')}
              </button>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryDashboard;
