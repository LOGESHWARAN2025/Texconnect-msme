import React, { useState, useMemo } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useAppContext } from '../context/AppContext';
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
  
  const initialFormData = { name: '', category: '', description: '', stock: 0, price: 0, unitOfMeasure: '', minStockLevel: 0 };
  const [formData, setFormData] = useState(initialFormData);

  // Filter inventory to only show items belonging to the current user
  const userInventory = useMemo(() => {
    if (!currentUser) return [];
    return inventory.filter(item => item.msmeId === currentUser.id);
  }, [inventory, currentUser]);

  const openModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ name: item.name, category: item.category, description: item.description || '', stock: item.stock, price: item.price, unitOfMeasure: item.unitOfMeasure, minStockLevel: item.minStockLevel });
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
    setFormData(prev => ({ ...prev, [name]: name === 'stock' || name === 'price' || name === 'minStockLevel' ? parseFloat(value) || 0 : value }));
  };
  
  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
        alert("Please enter a product name and category first.");
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
        alert("Failed to generate description. Please try again.");
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
      alert("Failed to save item. Please try again.");
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
            alert("Failed to delete item. Please try again.");
        }
      }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800">{t('manage_inventory')}</h3>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow"
        >
          {t('add_new_item')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('product_name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('category')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('stock')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('price_per_unit')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('unit_of_measure')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('minimum_stock_level')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {userInventory.length > 0 ? userInventory.map(item => {
              const isLowStock = item.stock <= item.minStockLevel && item.minStockLevel > 0;
              return (
              <tr key={item.id} className={`${isLowStock ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'} transition-colors duration-200`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    <div className="flex items-center">
                        {item.name}
                        {isLowStock && (
                            // FIX: Replaced the 'title' attribute with a <title> element inside the SVG for accessibility and to resolve the TypeScript error.
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <title>{t('stock_alert')}</title>
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.category}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="max-w-xs truncate" title={item.description}>{item.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center">
                        <span className={isLowStock ? 'text-red-600 font-bold' : ''}>
                            {item.stock.toLocaleString('en-IN')}
                        </span>
                        {isLowStock && (
                             <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {t('stock_alert')}
                             </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">₹{item.price.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.unitOfMeasure}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.minStockLevel.toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openModal(item)} className="text-primary hover:text-primary/80">{t('edit')}</button>
                  <button onClick={() => setItemToDelete(item)} className="text-red-600 hover:text-red-800">{t('delete')}</button>
                </td>
              </tr>
              );
            }) : (
              <tr><td colSpan={8} className="text-center py-10 text-slate-500">{t('no_inventory')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? t('edit_item') : t('add_new_item')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('product_name')}</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('category')}</label>
            <input type="text" name="category" value={formData.category} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center disabled:opacity-50 disabled:cursor-wait">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v1.586l.707.707a1 1 0 01-1.414 1.414L10 6.414l-.293.293a1 1 0 01-1.414-1.414L9 5.586V4a1 1 0 011-1z" /><path d="M10 15a1 1 0 01-1-1v-1.586l-.707-.707a1 1 0 011.414-1.414L10 13.586l.293-.293a1 1 0 011.414 1.414L11 12.414V14a1 1 0 01-1 1z" /><path d="M3 10a1 1 0 011-1h1.586l.707-.707a1 1 0 011.414 1.414L6.414 10l.293.293a1 1 0 01-1.414 1.414L4.586 11H4a1 1 0 01-1-1z" /><path d="M15 10a1 1 0 01-1 1h-1.586l-.707.707a1 1 0 01-1.414-1.414L13.586 10l-.293-.293a1 1 0 011.414-1.414L15.414 9H16a1 1 0 011 1z" /></svg>
                  {isGenerating ? 'Generating...' : 'Smart Description'}
                </button>
            </div>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="A short, catchy description of the product." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('stock')}</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('price_per_unit')}</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t('unit_of_measure')}</label>
            <input type="text" name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleInputChange} required placeholder="e.g., Kg, Meter, Piece" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700">{t('minimum_stock_level')}</label>
            <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={closeModal} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">{t('cancel')}</button>
            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400">
              {isSubmitting ? 'Saving...' : t('save_changes')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title={`${t('delete_item')}: ${itemToDelete?.name}`}>
        <div>
            <div className="bg-red-50 p-4 rounded-lg flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-md font-semibold text-red-800">Permanent Deletion</h3>
                    <p className="text-sm text-red-700 mt-1">
                        {t('confirm_delete')} This action cannot be undone.
                    </p>
                </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-5">
                <button 
                    onClick={() => setItemToDelete(null)} 
                    className="bg-white text-slate-800 px-4 py-2 rounded-lg font-semibold border border-slate-300 hover:bg-slate-100 transition"
                >
                    {t('cancel')}
                </button>
                <button 
                    onClick={handleDeleteConfirm} 
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow-sm"
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
