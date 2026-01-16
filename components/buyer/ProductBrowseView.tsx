import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/SupabaseContext';
import { useLocalization } from '../../hooks/useLocalization';
import { useTranslate } from '../../hooks/useTranslator';
import type { Product, MSMEDomain, User } from '../../types';
import Modal from '../common/Modal';
import InventoryProgressBar from '../common/InventoryProgressBar';
import StarRating from '../common/StarRating';
import { MSME_DOMAINS } from '../../constants';
import { optimizedDataService } from '../../src/services/optimizedDataService';
import cacheService from '../../src/services/cacheService';

const ProductCard: React.FC<{ item: Product; supplierName: string; supplierDomain: MSMEDomain | undefined; onOrder: () => void }> = ({ item, supplierName, supplierDomain, onOrder }) => {
    const { t, language } = useLocalization();
    const domainText = supplierDomain ? t(supplierDomain.toLowerCase().replace(/ /g, '_')) : t('product');

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
        <div className="group bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col border border-slate-100">
            <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                        {domainText}
                    </span>
                    <StarRating
                        rating={item.averageRating || 0}
                        totalRatings={item.totalRatings || 0}
                        size="sm"
                    />
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">{translatedName}</h3>
                <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wider">
                    {t('by')} <span className="text-indigo-600">{translatedSupplier}</span>
                </p>

                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-end gap-1">
                        <span className="text-sm font-black text-slate-400 mb-1">₹</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{item.price.toLocaleString()}</span>
                    </div>
                </div>

                <p className="text-xs font-medium text-slate-500 mt-4 line-clamp-2 h-8 leading-relaxed">{translatedDescription}</p>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>{t('stock')}</span>
                        <span>{item.stock}/{item.initialStock || item.stock}</span>
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
                className="w-full bg-slate-900 group-hover:bg-indigo-600 text-white font-black py-5 px-5 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed uppercase tracking-[2px] text-xs">
                {item.stock === 0 ? t('out_of_stock') : t('place_order')}
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
    const [isOffline, setIsOffline] = useState(!cacheService.isApplicationOnline());

    // ⚡ Prefetch data on component mount for better performance
    useEffect(() => {
        console.log('⚡ Prefetching data for ProductBrowseView...');
        optimizedDataService.prefetchData(undefined, currentUser?.id);

        // Save data for offline access
        if (products.length > 0 || users.length > 0) {
            cacheService.saveOfflineData({
                products,
                users
            });
        }

        // Listen for online/offline changes
        const handleOnline = () => {
            console.log('✅ Application is online');
            setIsOffline(false);
        };
        const handleOffline = () => {
            console.log('⚠️ Application is offline');
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [currentUser?.id, products, users]);

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
                alert(t('error_placing_order'));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Offline Indicator */}
            {isOffline && (
                <div className="bg-amber-50/80 backdrop-blur-xl border border-amber-200 rounded-3xl p-6 flex items-center gap-4 shadow-xl shadow-amber-500/10">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">
                        📱
                    </div>
                    <div>
                        <p className="font-black text-amber-900 uppercase tracking-widest text-xs mb-1">{t('off_line_mode')}</p>
                        <p className="text-sm text-amber-700 font-bold">{t('viewing_cached_data')}</p>
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/20">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Search Input */}
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_products_or_suppliers')}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Domain Filter */}
                        <div className="relative group min-w-[240px]">
                            <select
                                id="domain-filter"
                                value={domainFilter}
                                onChange={e => setDomainFilter(e.target.value as MSMEDomain | 'all')}
                                className="w-full appearance-none pl-6 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white focus:border-indigo-600 outline-none transition-all cursor-pointer"
                            >
                                <option value="all">{t('all_domains')}</option>
                                {availableDomains.map(domain => (
                                    <option key={domain} value={domain}>
                                        {t(domain.toLowerCase().replace(/ /g, '_'))}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none group-hover:translate-y-0.5 transition-transform">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Sort Control */}
                        <div className="relative group min-w-[200px]">
                            <select
                                id="sort-by"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as 'price' | 'stock' | 'name')}
                                className="w-full appearance-none pl-6 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-600/10 focus:bg-white focus:border-indigo-600 outline-none transition-all cursor-pointer"
                            >
                                <option value="name">{t('sort_by_name')}</option>
                                <option value="price">{t('sort_by_price')}</option>
                                <option value="stock">{t('sort_by_stock')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none group-hover:translate-y-0.5 transition-transform">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {currentUserDomain && (
                    <div className="mt-6 flex items-center gap-3 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <span className="text-xl">ℹ️</span>
                        <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">
                            {t('showing_other_domains')}
                        </p>
                    </div>
                )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-50">
                        📦
                    </div>
                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">{t('no_products_found')}</p>
                </div>
            )}

            {/* Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('place_order')}
            >
                {selectedItem && (
                    <div className="space-y-8 py-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[2px] text-indigo-500 mb-2 block">{t('confirm_order')}</span>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">{selectedItem.name}</h3>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest">
                                {t('available_stock')}: {selectedItem.stock.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label htmlFor="quantity" className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t('quantity')}</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    id="quantity"
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(1, Math.min(selectedItem.stock, parseInt(e.target.value, 10) || 1)))}
                                    min="1"
                                    max={selectedItem.stock}
                                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl focus:ring-4 focus:ring-indigo-600/10 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                                />
                                <div className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('units_label')}</div>
                            </div>
                        </div>

                        <div className="p-8 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/30 text-white">
                            <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">{t('total_amount')}</div>
                            <div className="text-4xl font-black tracking-tighter">₹{(selectedItem.price * quantity).toLocaleString()}</div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 uppercase tracking-widest text-xs"
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
