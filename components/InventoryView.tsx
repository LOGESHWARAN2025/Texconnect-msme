import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/SupabaseContext';
import Modal from './common/Modal';
import type { InventoryItem } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

const InventoryView: React.FC = () => {
  const { t } = useLocalization();
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, currentUser } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const initialFormData = { name: '', category: '', description: '', stock: 0, bought: 0, price: 0, unitOfMeasure: '', minStockLevel: 0 };
  const [formData, setFormData] = useState(initialFormData);

  // Filter inventory to only show items belonging to the current user
  const userInventory = useMemo(() => {
    if (!currentUser) {
      console.log('❌ No current user in InventoryView');
      return [];
    }
    const filtered = inventory.filter(item => item.msmeId === currentUser.id);
    console.log('📦 Inventory View:', {
      totalInventory: inventory.length,
      userInventory: filtered.length,
      currentUserId: currentUser.id,
      inventoryItems: filtered.map(i => ({ id: i.id, name: i.name, stock: i.stock }))
    });
    return filtered;
  }, [inventory, currentUser]);

  const openModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ name: item.name, category: item.category, description: item.description || '', stock: item.stock, bought: item.bought || 0, price: item.price, unitOfMeasure: item.unitOfMeasure, minStockLevel: item.minStockLevel });
    } else {
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'stock' || name === 'bought' || name === 'price' || name === 'minStockLevel' ? parseFloat(value) || 0 : value }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      alert(t('enter_name_category'));
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenerativeAI(process.env.API_KEY || '');
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Generate a concise and appealing product description for a textile product. Name: "${formData.name}", Category: "${formData.category}". The description should be suitable for an e-commerce platform targeting other businesses in the textile industry. Keep it under 50 words.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const description = response.text();
      setFormData(prev => ({ ...prev, description: description.trim() }));
    } catch (error) {
      console.error("Error generating description:", error);
      alert(t('failed_generate_description'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateInventoryItem({ ...editingItem, ...formData });
      } else {
        if (currentUser) {
          await addInventoryItem({ ...formData, msmeId: currentUser.id });
        }
      }
      closeModal();
    } catch (error: any) {
      console.error(`Failed to save inventory item: ${error.code} - ${error.message}`);
      alert(t('failed_save_item'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await deleteInventoryItem(itemToDelete.id);
        setItemToDelete(null);
      } catch (error: any) {
        console.error(`Failed to delete item: ${error.code} - ${error.message}`);
        alert(t('failed_delete_item') || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('manage_inventory')}</h3>
          <p className="text-slate-500 font-bold">{t('track_manage_inventory')}</p>
        </div>
        <button
          onClick={() => openModal()}
          className="group flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
          </svg>
          {t('add_new_item')}
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('product_name')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('category')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('description')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('reserved')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('available')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('bought')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('price_per_unit')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('unit_of_measure')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('minimum_stock_level')}</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {userInventory.length > 0 ? userInventory.map(item => {
                const isLowStock = item.stock <= item.minStockLevel && item.minStockLevel > 0;
                return (
                  <tr key={item.id} className={`group transition-all duration-300 ${isLowStock ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        {isLowStock && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <title>{t('stock_alert')}</title>
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                    </td>
                    <td className="px-8 py-6 max-w-xs transition-opacity hover:opacity-100 opacity-60">
                      <div className="text-xs font-bold text-slate-600 truncate" title={item.description}>{item.description || '-'}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-black text-orange-600">{(item.reserved || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {(item.stock - (item.reserved || 0)).toLocaleString('en-IN')}
                        </span>
                        {isLowStock && (
                          <span className="px-2 py-0.5 inline-flex text-[8px] font-black uppercase tracking-widest rounded-md bg-red-100 text-red-700">
                            {t('low')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-black text-indigo-600">₹{(item.bought || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-slate-900">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500 uppercase tracking-wider">{item.unitOfMeasure}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-slate-400">{item.minStockLevel.toLocaleString('en-IN')}</td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-4">
                        <button onClick={() => openModal(item)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setItemToDelete(item)} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={10} className="text-center py-24 text-slate-400 font-bold">{t('no_inventory')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? t('edit_item') : t('add_new_item')}>
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('product_name')}</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" placeholder={t('product_name_placeholder')} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('category')}</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" placeholder={t('category_placeholder')} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t('description')}</label>
                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg transition-all disabled:opacity-50">
                  {isGenerating ? (
                    <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {isGenerating ? t('generating') : t('smart_description')}
                </button>
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder={t('description_placeholder')} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('stock')}</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('bought_total_cost')}</label>
                <input type="number" name="bought" value={formData.bought} onChange={handleInputChange} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" placeholder={t('total_spent_placeholder')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('price_per_unit')}</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('unit_of_measure')}</label>
                <input type="text" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleInputChange} required placeholder={t('uom_placeholder')} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('minimum_stock_level')}</label>
                <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleInputChange} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">{t('cancel')}</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs">
                {isSubmitting ? t('saving') : t('save_changes')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title={`${t('delete_item')}: ${itemToDelete?.name}`}>
        <div className="p-2">
          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-red-900 tracking-tight mb-2">{t('permanent_deletion')}</h3>
            <p className="text-red-700 font-bold leading-relaxed">
              {t('confirm_delete')} <br />
              <span className="opacity-70">{t('action_cannot_be_undone')}</span>
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => setItemToDelete(null)}
              className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 uppercase tracking-widest text-xs"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryView;
