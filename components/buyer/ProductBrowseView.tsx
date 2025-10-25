import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { useTranslate } from '../../hooks/useTranslator';
import type { Product, MSMEDomain, User } from '../../types';
import Modal from '../common/Modal';
import InventoryProgressBar from '../common/InventoryProgressBar';
import StarRating from '../common/StarRating';
import { MSME_DOMAINS } from '../../constants';

const ProductCard: React.FC<{ item: Product; supplierName: string; supplierDomain: MSMEDomain | undefined; onOrder: () => void }> = ({ item, supplierName, supplierDomain, onOrder }) => {
    const { t, language } = useLocalization();
    const domainText = supplierDomain ? t(supplierDomain.toLowerCase().replace(/ /g, '_')) : 'Product';
    
    // Debug: Log rating values
    console.log('🌟 Product Rating Debug:', {
        productName: item.name,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
        hasRating: item.averageRating && item.averageRating > 0
    });
    
    // Always call hooks (React rule)
    const translatedNameRaw = useTranslate(item.name);
    const translatedDescriptionRaw = useTranslate(item.description || '');
    const translatedSupplierRaw = useTranslate(supplierName);
    
    // Use translated or original based on language
    const translatedName = language === 'ta' ? translatedNameRaw : item.name;
    const translatedDescription = language === 'ta' ? translatedDescriptionRaw : (item.description || '');
    const translatedSupplier = language === 'ta' ? translatedSupplierRaw : supplierName;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 flex flex-col">
            <div className="p-5 flex-grow">
                <p className="text-xs text-secondary font-semibold uppercase">{domainText}</p>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{translatedName}</h3>
                <p className="text-sm text-slate-500 mt-2">By <span className="font-semibold text-slate-600">{translatedSupplier}</span></p>
                <p className="text-2xl font-extrabold text-slate-900 mt-3">₹{item.price.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">{translatedDescription}</p>
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 font-medium">Stock: {item.stock}/{item.initialStock || item.stock}</span>
                        <StarRating 
                            rating={item.averageRating || 0} 
                            totalRatings={item.totalRatings || 0}
                            size="sm"
                        />
                    </div>
                    <InventoryProgressBar
                        currentStock={item.stock}
                        initialStock={item.initialStock || item.stock}
                        size="sm"
                        showNumbers={false}
                    />
                </div>
            </div>
            <button 
                onClick={onOrder}
                disabled={item.stock === 0}
                className="w-full bg-primary text-white font-bold py-3 px-5 hover:bg-primary/90 transition disabled:bg-slate-300 disabled:cursor-not-allowed">
                {t('place_order')}
            </button>
        </div>
    );
};

export const ProductBrowseView: React.FC = () => {
    const { t } = useLocalization();
    const { products, placeOrder, users, currentUser } = useAppContext();
    const [domainFilter, setDomainFilter] = useState<MSMEDomain | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'price' | 'stock' | 'name'>('name');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Get supplier info map
    const allUsersMap = useMemo(() => {
        const map = new Map<string, User>();
        users.forEach(u => map.set(u.id, u));
        return map;
    }, [users]);

    // Get the current user's domain if they are an MSME user
    const currentUserDomain = useMemo(() => {
        return currentUser?.role === 'msme' ? currentUser.domain : undefined;
    }, [currentUser]);

    // Filter available domains to exclude MSME user's own domain
    const availableDomains = useMemo(() => {
        if (!currentUserDomain) {
            return MSME_DOMAINS;
        }
        return MSME_DOMAINS.filter(domain => domain !== currentUserDomain);
    }, [currentUserDomain]);

    const filteredProducts = useMemo(() => {
        // Debug info (production-safe)
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Buyer ProductBrowseView - Debug Info:');
            console.log('Total products:', products.length);
            console.log('Users map size:', allUsersMap.size);
        }
        
        // If users data hasn't loaded yet, return empty array to avoid showing invalid results
        if (products.length > 0 && allUsersMap.size === 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log('⏳ Users data not loaded yet, waiting...');
            }
            return [];
        }
        
        // First filter by valid MSMEs and ensure msmeId exists
        const validProducts = products.filter(item => {
            if (!item.msmeId) {
                return false;
            }
            const supplier = allUsersMap.get(item.msmeId);
            return supplier && supplier.role === 'msme';
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Valid products count after filtering:', validProducts.length);
            console.log('Current user domain (if MSME):', currentUserDomain);
            console.log('Current user ID:', currentUser?.id);
        }

        // Exclude current user's own products (users cannot buy from themselves)
        const notOwnProducts = validProducts.filter(item => {
            return item.msmeId !== currentUser?.id;
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Excluded own products. Remaining:', notOwnProducts.length);
        }

        // If current user is an MSME (toggled to buyer mode), exclude products from their own domain
        const domainExcludedProducts = currentUserDomain
            ? notOwnProducts.filter(item => {
                if (!item.msmeId) return false;
                const supplier = allUsersMap.get(item.msmeId);
                // Exclude products from the same domain as the MSME user
                return supplier?.domain !== currentUserDomain;
            })
            : notOwnProducts;

        if (process.env.NODE_ENV === 'development' && currentUserDomain) {
            console.log(`🚫 Excluded products from domain "${currentUserDomain}". Remaining:`, domainExcludedProducts.length);
        }

        // Then apply domain filter
        const domainFiltered = domainFilter === 'all' 
            ? domainExcludedProducts 
            : domainExcludedProducts.filter(item => {
                if (!item.msmeId) return false; // Skip items without msmeId
                const supplier = allUsersMap.get(item.msmeId);
                return supplier?.domain === domainFilter;
            });

        // Apply search filter
        const searchFiltered = searchQuery 
            ? domainFiltered.filter(item => {
                if (!item.msmeId) return false; // Skip items without msmeId
                const supplier = allUsersMap.get(item.msmeId);
                const searchLower = searchQuery.toLowerCase();
                return (
                    item.name.toLowerCase().includes(searchLower) ||
                    (item.description?.toLowerCase().includes(searchLower) ?? false) ||
                    supplier?.companyName?.toLowerCase().includes(searchLower) ||
                    supplier?.username.toLowerCase().includes(searchLower)
                );
            })
            : domainFiltered;

        // Apply sorting
        return searchFiltered.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return a.price - b.price;
                case 'stock':
                    return b.stock - a.stock;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }, [products, domainFilter, searchQuery, sortBy, allUsersMap, currentUserDomain]);


    const handleOrderClick = (item: Product) => {
        setSelectedItem(item);
        setQuantity(1);
        setIsModalOpen(true);
    };

    const handleConfirmOrder = async () => {
        if (selectedItem && quantity > 0) {
            setIsSubmitting(true);
            try {
                await placeOrder(selectedItem, quantity);
                setIsModalOpen(false);
                setSelectedItem(null);
            } catch (error: any) {
                const sanitizedCode = String(error.code || 'unknown').replace(/[\r\n]/g, '');
                const sanitizedMessage = String(error.message || 'unknown error').replace(/[\r\n]/g, '');
                console.error(`Failed to place order: ${sanitizedCode} - ${sanitizedMessage}`);
                alert("There was an error placing your order. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Controls Section */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label htmlFor="search" className="sr-only">{t('search_products_or_suppliers')}</label>
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_products_or_suppliers')}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                    </div>
                    
                    {/* Domain Filter */}
                    <div className="relative sm:w-64">
                        <label htmlFor="domain-filter" className="sr-only">{t('filter_by_domain')}</label>
                        <select
                            id="domain-filter"
                            value={domainFilter}
                            onChange={e => setDomainFilter(e.target.value as MSMEDomain | 'all')}
                            className="block appearance-none w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 pr-8 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="all">{t('all_domains')}</option>
                            {availableDomains.map(domain => (
                                <option key={domain} value={domain}>
                                    {t(domain.toLowerCase().replace(/ /g, '_'))}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Sort Control */}
                    <div className="relative sm:w-48">
                        <label htmlFor="sort-by" className="sr-only">{t('sort_by')}</label>
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'price' | 'stock' | 'name')}
                            className="block appearance-none w-full bg-white border border-slate-300 hover:border-slate-400 px-4 py-2 pr-8 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="name">{t('sort_by_name')}</option>
                            <option value="price">{t('sort_by_price')}</option>
                            <option value="stock">{t('sort_by_stock')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        {/* Removed products_found text */}
                    </div>
                    {currentUserDomain && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                            ℹ️ Showing products from other domains only
                        </div>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(item => {
                        if (!item.msmeId) return null; // Skip items without msmeId
                        const supplier = allUsersMap.get(item.msmeId);
                        if (!supplier) return null;
                        return (
                            <ProductCard
                                key={item.id}
                                item={item}
                                supplierName={supplier.companyName || supplier.username}
                                supplierDomain={supplier.domain}
                                onOrder={() => handleOrderClick(item)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-slate-500">{t('no_products_found')}</p>
                </div>
            )}

            {/* Order Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={t('place_order')}
            >
                {selectedItem && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">{selectedItem.name}</h3>
                        <p className="text-sm text-slate-500">{t('available_stock')}: {selectedItem.stock.toLocaleString()}</p>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">{t('quantity')}</label>
                            <input
                                type="number"
                                id="quantity"
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, Math.min(selectedItem.stock, parseInt(e.target.value, 10) || 1)))}
                                min="1"
                                max={selectedItem.stock}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div className="text-xl font-bold pt-2">
                            {t('total')}: ₹{(selectedItem.price * quantity).toLocaleString()}
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={handleConfirmOrder} 
                                disabled={isSubmitting} 
                                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition shadow disabled:bg-slate-400"
                            >
                                {isSubmitting ? t('placing_order') : t('confirm_order')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProductBrowseView;
