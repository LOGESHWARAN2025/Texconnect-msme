import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import type { Product } from '../../types';
import Modal from '../common/Modal';
import InventoryProgressBar from '../common/InventoryProgressBar';

const ProductCard: React.FC<{ item: Product; onEdit: (item: Product) => void; onDelete: (item: Product) => void }> = ({ item, onEdit, onDelete }) => {
    const { t } = useLocalization();
    
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {item.stock > 0 ? t('active') : t('inactive')}
                        </span>
                        <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Product"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Product"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {item.description && (
                    <p className="text-sm text-slate-500 mb-2">{t('description')}: {item.description}</p>
                )}
                
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-slate-600">{t('price')}:</span>
                        <span className="font-semibold text-slate-800">₹{item.price.toLocaleString()}</span>
                    </div>
                    
                    <div>
                        <InventoryProgressBar
                            currentStock={item.stock}
                            initialStock={item.initialStock || item.stock}
                            size="sm"
                            showNumbers={true}
                        />
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        {t('visible_to_buyers')}: {item.stock > 0 ? 
                            <span className="text-green-600 font-medium">{t('yes')}</span> : 
                            <span className="text-red-600 font-medium">{t('no')}</span>
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

const ProductManagementView: React.FC = () => {
    const { t } = useLocalization();
    const { products, currentUser, addProduct, updateProduct, deleteProduct } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        initialStock: 0
        
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Filter products to show only current MSME's products
    const msmeProducts = useMemo(() => {
        if (!currentUser) return [];
        return products.filter(item => item.msmeId === currentUser.id);
    }, [products, currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' || name === 'initialStock'
                ? parseFloat(value) || 0 
                : value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            initialStock: 0
        });
    };

    const handleAddProduct = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const handleEditProduct = (item: Product) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            price: item.price,
            stock: item.stock,
            initialStock: item.initialStock || item.stock
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteProduct = (item: Product) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSubmitting(true);

        try {
            await addProduct({
                ...formData,
                msmeId: currentUser.id
            });
            setIsAddModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error adding product:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsSubmitting(true);

        try {
            await updateProduct({ ...formData, id: selectedItem.id, msmeId: selectedItem.msmeId });
            setIsEditModalOpen(false);
            setSelectedItem(null);
            resetForm();
        } catch (error) {
            console.error('Error updating product:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);

        try {
            await deleteProduct(selectedItem.id);
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Separate active and inactive products
    const activeProducts = useMemo(() => 
        msmeProducts.filter(item => item.stock > 0), 
        [msmeProducts]
    );
    
    const inactiveProducts = useMemo(() => 
        msmeProducts.filter(item => item.stock === 0), 
        [msmeProducts]
    );
    
    const lowStockProducts = useMemo(() => 
        activeProducts.filter(item => item.stock <= 5), // Consider low stock as 5 or less
        [activeProducts]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Product</h1>
                        <p className="text-slate-600">Company Product List</p>
                    </div>
                    <button
                        onClick={handleAddProduct}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('total_products')}</p>
                            <p className="text-2xl font-bold text-slate-900">{msmeProducts.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('active_products')}</p>
                            <p className="text-2xl font-bold text-green-600">{activeProducts.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('low_stock')}</p>
                            <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('inactive_products')}</p>
                            <p className="text-2xl font-bold text-slate-600">{inactiveProducts.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Products Section */}
            {activeProducts.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        Your Products ({activeProducts.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProducts.map(item => (
                            <ProductCard key={item.id} item={item} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
                        ))}
                    </div>
                </div>
            )}

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {t('low_stock_alert')} ({lowStockProducts.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lowStockProducts.map(item => (
                            <ProductCard key={item.id} item={item} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
                        ))}
                    </div>
                </div>
            )}

            {/* Inactive Products Section */}
            {inactiveProducts.length > 0 && (
                <div className="bg-slate-50 rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="w-3 h-3 bg-slate-400 rounded-full mr-3"></span>
                        {t('inactive_or_out_of_stock')} ({inactiveProducts.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactiveProducts.map(item => (
                            <ProductCard key={item.id} item={item} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {msmeProducts.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{t('no_products_yet')}</h3>
                    <p className="text-slate-500 mb-4">{t('add_products_to_showcase')}</p>
                    <p className="text-sm text-slate-400">{t('go_to_inventory_to_add_products')}</p>
                </div>
            )}

            {/* Add Product Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Product">
                <form onSubmit={handleSubmitAdd} className="space-y-4">
                    <div>
                        <label htmlFor="add-product-name" className="block text-sm font-medium text-slate-700">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            id="add-product-name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Initial Stock</label>
                            <input
                                type="number"
                                name="initialStock"
                                value={formData.initialStock}
                                onChange={handleInputChange}
                                min="0"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700">Current Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                min="0"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        <p className="mt-1 text-sm text-slate-500">Current available stock (usually same as initial stock when creating)</p>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Product Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Product">
                <form onSubmit={handleSubmitEdit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-product-name" className="block text-sm font-medium text-slate-700">Product Name</label>
                        <input
                            id="edit-product-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            aria-label="Product Name"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Stock Quantity</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                min="0"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Product'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Product">
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Are you sure you want to delete <strong>{selectedItem?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow disabled:bg-slate-400"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Product'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductManagementView;
