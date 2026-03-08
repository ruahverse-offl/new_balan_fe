import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { getMedicines } from '../services/medicinesApi';
import { getBrands } from '../services/brandsApi';
import { getCategories } from '../services/categoriesApi';
import { getDeliverySettings } from '../services/deliveryApi';
import { mapMedicineToFrontend } from '../utils/dataMapper';
import { ShoppingCart, Search, Filter, AlertCircle, ShoppingBag, Trash2, Plus, Minus, X, Clock, Check, ChevronDown, Loader2, Package } from 'lucide-react';
import { prodCheck } from '../config';
import './Pharmacy.css';

const PharmacyComingSoon = () => (
    <div className="pharmacy-page animate-fade">
        <header className="page-header pharmacy-header">
            <div className="container">
                <div className="pharmacy-header-content">
                    <div className="header-text">
                        <h1 style={{ color: '#fff' }}>Online Pharmacy</h1>
                        <p>Genuine medicines delivered with care.</p>
                    </div>
                </div>
            </div>
        </header>
        <section className="section shop-section">
            <div className="container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ fontSize: '1.25rem', color: 'var(--gray-700)', margin: 0 }}>
                    We are coming to online store soon.
                </p>
            </div>
        </section>
    </div>
);

const Pharmacy = () => {
    const [products, setProducts] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true });
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { cart, addToCart, setIsCartOpen, subtotal } = useCart();
    const toast = useToast();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Brand selector state
    const [brandsMap, setBrandsMap] = useState({});
    const [brandSelectorProduct, setBrandSelectorProduct] = useState(null);
    const brandSelectorRef = useRef(null);

    const categories = ['All', ...dynamicCategories];
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24;

    if (!prodCheck) {
        return <PharmacyComingSoon />;
    }

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [medicinesResponse, brandsResponse, categoriesResponse, settings] = await Promise.all([
                    getMedicines({ limit: 100, is_active: true }).catch((err) => { toast.error('Failed to load medicines'); return { items: [] }; }),
                    getBrands({ limit: 100 }).catch(() => ({ items: [] })),
                    getCategories({ limit: 100, is_active: true }).catch(() => ({ items: [] })),
                    getDeliverySettings().catch(() => ({ is_enabled: true }))
                ]);

                // Build price map and brands map
                const priceMap = {};
                const bMap = {};
                (brandsResponse.items || []).forEach(brand => {
                    const mid = brand.medicine_id;
                    const mrp = parseFloat(brand.mrp) || 0;
                    if (!priceMap[mid] || mrp < priceMap[mid]) {
                        priceMap[mid] = mrp;
                    }
                    if (!bMap[mid]) bMap[mid] = [];
                    bMap[mid].push(brand);
                });
                // Sort each medicine's brands by price
                Object.values(bMap).forEach(arr => arr.sort((a, b) => parseFloat(a.mrp) - parseFloat(b.mrp)));
                setBrandsMap(bMap);

                // Map medicines to frontend format with actual prices
                const mappedProducts = medicinesResponse.items.map(med => {
                    const mapped = mapMedicineToFrontend(med);
                    mapped.price = priceMap[med.id] || 0;
                    return mapped;
                });
                setProducts(mappedProducts);
                
                // Extract category names
                const categoryNames = categoriesResponse.items.map(cat => cat.name || cat.category_name);
                setDynamicCategories(categoryNames);
                
                setDeliverySettings(settings);
            } catch (err) {
                console.error('Error fetching pharmacy data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced autocomplete fetch
    const fetchSuggestions = (query) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setSuggestionsLoading(true);
        setShowSuggestions(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const response = await getMedicines({ search: query, limit: 5, is_active: true });
                const mapped = response.items.map(med => {
                    const m = mapMedicineToFrontend(med);
                    // Use prices from already-loaded products
                    const existing = products.find(p => p.id === med.id);
                    if (existing) m.price = existing.price;
                    return m;
                });
                setSuggestions(mapped);
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        }, 300);
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutsideSearch = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideSearch);
        return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
    }, []);

    // Close suggestions on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') setShowSuggestions(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Handle search input change with autocomplete
    const handleSearchInput = (value) => {
        handleFilterChange('search', value);
        fetchSuggestions(value);
    };

    // Handle suggestion click - set search term and trigger main search
    const handleSuggestionClick = (medicine) => {
        setSearchTerm(medicine.name);
        setCurrentPage(1);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Close brand selector on outside click
    useEffect(() => {
        const handleClickOutsideBrand = (event) => {
            if (brandSelectorRef.current && !brandSelectorRef.current.contains(event.target)) {
                setBrandSelectorProduct(null);
            }
        };
        if (brandSelectorProduct) {
            document.addEventListener('mousedown', handleClickOutsideBrand);
            return () => document.removeEventListener('mousedown', handleClickOutsideBrand);
        }
    }, [brandSelectorProduct]);

    // Handle add to cart - show brand selector if multiple brands
    const handleAddToCart = (prod) => {
        const brands = brandsMap[prod.id] || [];
        if (brands.length <= 1) {
            const brand = brands[0];
            const cartItem = {
                ...prod,
                price: brand ? parseFloat(brand.mrp) : prod.price,
                brandName: brand?.brand_name || null,
                manufacturer: brand?.manufacturer || null,
                brandId: brand?.id || null,
            };
            addToCart(cartItem);
            toast.success(`${prod.name} added to cart`);
        } else {
            setBrandSelectorProduct(prod);
        }
    };

    const handleBrandSelect = (prod, brand) => {
        const cartItem = {
            ...prod,
            id: `${prod.id}_${brand.id}`,
            medicineId: prod.id,
            price: parseFloat(brand.mrp),
            brandName: brand.brand_name,
            manufacturer: brand.manufacturer,
            brandId: brand.id,
            name: `${prod.name} (${brand.brand_name})`,
        };
        addToCart(cartItem);
        toast.success(`${brand.brand_name} added to cart`);
        setBrandSelectorProduct(null);
    };

    // Use admin settings for delivery availability
    const isOrderAllowed = () => {
        return deliverySettings.is_enabled !== false;
    };

    // Reset pagination on search or category change
    const handleFilterChange = (type, value) => {
        setCurrentPage(1);
        if (type === 'search') setSearchTerm(value);
        if (type === 'category') {
            setActiveCategory(value);
            setIsDropdownOpen(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p && p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="pharmacy-page animate-fade">
            <header className="page-header pharmacy-header">
                <div className="container">
                    <div className="pharmacy-header-content">
                        <div className="header-text">
                            <h1 style={{ color: '#fff' }}>Online Pharmacy</h1>
                            <p>Genuine medicines delivered with care.</p>
                        </div>
                        <button className="cart-trigger" onClick={() => setIsCartOpen(true)}>
                            <ShoppingCart size={24} />
                            <span className="cart-count">{cart.length}</span>
                            <div className="cart-total">₹{subtotal.toFixed(2)}</div>
                        </button>
                    </div>
                </div>
            </header>

            <section className="section shop-section">
                <div className="container">
                    <div className="shop-controls flex items-center justify-between">
                        <div ref={searchRef} style={{ position: 'relative', flex: 1 }}>
                            <div className="search-bar">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by medicine name..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                    autoComplete="off"
                                />
                            </div>
                            {showSuggestions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#fff',
                                    borderRadius: '0 0 8px 8px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                    zIndex: 100,
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    border: '1px solid #e2e8f0',
                                    borderTop: 'none',
                                }}>
                                    {suggestionsLoading && (
                                        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            Searching...
                                        </div>
                                    )}
                                    {!suggestionsLoading && suggestions.length === 0 && searchTerm.length >= 2 && (
                                        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            No medicines found
                                        </div>
                                    )}
                                    {!suggestionsLoading && suggestions.map((med) => (
                                        <div
                                            key={med.id}
                                            onClick={() => handleSuggestionClick(med)}
                                            style={{
                                                padding: '10px 16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid #f1f5f9',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.95rem', color: '#1e293b' }}>{med.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{med.category}</div>
                                            </div>
                                            {med.price > 0 && (
                                                <div style={{ fontWeight: 600, color: 'var(--primary, #2563eb)', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                                                    ₹{med.price}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="custom-dropdown" ref={dropdownRef}>
                            <button
                                className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <Filter size={18} className="filter-icon" />
                                <span>{activeCategory === 'All' ? 'All Categories' : activeCategory}</span>
                                <ChevronDown size={16} className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="dropdown-menu animate-slide-down">
                                    {categories.map(cat => (
                                        <div
                                            key={cat}
                                            className={`dropdown-item ${activeCategory === cat ? 'selected' : ''}`}
                                            onClick={() => handleFilterChange('category', cat)}
                                        >
                                            {cat === 'All' ? 'All Categories' : cat}
                                            {activeCategory === cat && <Check size={14} className="check-icon" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: '1rem' }}>Loading products...</p>
                        </div>
                    )}
                    {error && (
                        <div className="time-alert" style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
                            <AlertCircle size={20} />
                            <span>Error loading products: {error}</span>
                        </div>
                    )}
                    {!loading && !error && products.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <ShoppingBag size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                            <p>No products available at the moment.</p>
                        </div>
                    )}

                    {!isOrderAllowed() && (
                        <div className="time-alert">
                            <Clock size={20} />
                            <span>Notice: Home delivery is currently unavailable. You can still browse our inventory.</span>
                        </div>
                    )}

                    <div className="product-grid">
                        {paginatedProducts.map(prod => (
                            <div key={prod.id} className="product-card">
                                <div className="product-image">
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.name} className="product-img-render" />
                                    ) : (
                                        <ShoppingBag size={48} className="placeholder-icon" />
                                    )}
                                    {prod.requiresPrescription && <span className="prescription-badge">RX Required</span>}
                                    {!prod.stock && <div className="out-of-stock">Out of Stock</div>}
                                </div>
                                <div className="product-info">
                                    <span className="p-cat">{prod.category}</span>
                                    <h3 onClick={() => navigate(`/pharmacy/medicine/${prod.id}`)} style={{ cursor: 'pointer', color: 'var(--gray-800)' }} title="View details">{prod.name}</h3>
                                    <div className="p-price">
                                        {prod.price > 0 ? (
                                            <>
                                                <span className="current">{(brandsMap[prod.id]?.length || 0) > 1 ? 'from ' : ''}₹{prod.price}</span>
                                                {(brandsMap[prod.id]?.length || 0) > 1 && (
                                                    <span className="brand-count">{brandsMap[prod.id].length} brands</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="current" style={{ color: 'var(--gray-400)' }}>Price N/A</span>
                                        )}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="add-btn"
                                                disabled={!prod.stock || !isOrderAllowed()}
                                                onClick={() => handleAddToCart(prod)}
                                                style={{ flex: 1 }}
                                            >
                                                {prod.stock ? 'Add to Cart' : 'Out of Stock'}
                                            </button>
                                            <button
                                                className="add-btn"
                                                onClick={() => navigate(`/pharmacy/medicine/${prod.id}`)}
                                                style={{ flex: 0, padding: '0.5rem 0.75rem', background: 'var(--gray-100, #f3f4f6)', color: 'var(--gray-700, #374151)', fontSize: '0.8rem' }}
                                            >
                                                View
                                            </button>
                                        </div>
                                        {brandSelectorProduct?.id === prod.id && (
                                            <div className="brand-selector" ref={brandSelectorRef}>
                                                <div className="brand-selector-header">
                                                    <Package size={16} />
                                                    <span>Choose Brand</span>
                                                    <button className="brand-selector-close" onClick={() => setBrandSelectorProduct(null)}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="brand-selector-list">
                                                    {(brandsMap[prod.id] || []).map(brand => (
                                                        <button
                                                            key={brand.id}
                                                            className="brand-option"
                                                            onClick={() => handleBrandSelect(prod, brand)}
                                                        >
                                                            <div className="brand-option-info">
                                                                <span className="brand-option-name">{brand.brand_name}</span>
                                                                <span className="brand-option-mfg">{brand.manufacturer}</span>
                                                            </div>
                                                            <span className="brand-option-price">₹{parseFloat(brand.mrp).toFixed(0)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Previous
                            </button>

                            <div className="page-numbers">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                className="page-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Pharmacy;
