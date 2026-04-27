import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { getMedicines } from '../services/medicinesApi';
import { getTherapeuticCategories } from '../services/therapeuticCategoriesApi';
import { mapMedicineToFrontend } from '../utils/dataMapper';
import { isBrandPurchasable, brandStockQuantity } from '../utils/pharmacyStock';
import { cartLinesForMedicine, totalUnitsForMedicineLines } from '../utils/cartMedicine';
import { ShoppingCart, Search, Filter, AlertCircle, ShoppingBag, Plus, Minus, X, Clock, Check, ChevronDown, Package, Phone } from 'lucide-react';
import { InlineSpinner } from '../components/common/PageLoading';
import { prodCheck } from '../config';
import './Pharmacy.css';

/** Matches Contact page / chatbot store line for phone orders when the online store flag is off. */
const PHARMACY_ORDER_PHONE_TEL = 'tel:+919894880598';
const PHARMACY_ORDER_PHONE_DISPLAY = '+91 98948 80598';

const PharmacyComingSoon = () => (
    <div className="pharmacy-page animate-fade">
        <header className="page-header pharmacy-header" aria-label="Pharmacy">
            <div className="container">
                <div className="pharmacy-header-content">
                    <div className="header-text">
                        <h1 className="pharmacy-hero-title">Online Pharmacy</h1>
                        <p className="pharmacy-hero-subtitle">Genuine medicines delivered with care.</p>
                    </div>
                </div>
            </div>
        </header>
        <section className="section shop-section">
            <div className="container pharmacy-coming-soon">
                <div className="pharmacy-coming-soon__card">
                    <h2 className="pharmacy-coming-soon__title">We will open online store soon</h2>
                    <p className="pharmacy-coming-soon__lead">
                        Meanwhile you can order by calling us — we are providing home deliveries also.
                    </p>
                    <a className="pharmacy-coming-soon__phone" href={PHARMACY_ORDER_PHONE_TEL}>
                        <Phone size={22} aria-hidden />
                        <span>Call {PHARMACY_ORDER_PHONE_DISPLAY}</span>
                    </a>
                </div>
            </div>
        </section>
    </div>
);

const Pharmacy = () => {
    const [products, setProducts] = useState([]);
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { cart, addToCart, updateQuantity, removeFromCart, setIsCartOpen, subtotal } = useCart();
    const toast = useToast();
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
    const [brandModalSelectedId, setBrandModalSelectedId] = useState(null);
    const [brandModalQty, setBrandModalQty] = useState(1);
    const brandModalRef = useRef(null);

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
                // Prices come from nested brands (include_brands=true)
                const [medicinesResponse, therapeuticCategoriesResponse] = await Promise.all([
                    getMedicines({ limit: 500, is_available: true, include_brands: true }).catch((err) => { toast.error('Failed to load medicines'); return { items: [] }; }),
                    getTherapeuticCategories({ limit: 100, is_active: true }).catch(() => ({ items: [] })),
                ]);

                // Build price map and brands map from nested brands on each medicine
                const priceMap = {};
                const bMap = {};
                (medicinesResponse.items || []).forEach((med) => {
                    const mid = med.id;
                    (med.brands || []).forEach((brand) => {
                        if (!isBrandPurchasable(brand)) return;
                        const mrp = parseFloat(brand.mrp) || 0;
                        if (!priceMap[mid] || mrp < priceMap[mid]) {
                            priceMap[mid] = mrp;
                        }
                        if (!bMap[mid]) bMap[mid] = [];
                        bMap[mid].push(brand);
                    });
                });
                // Sort each medicine's brands by price
                Object.values(bMap).forEach(arr => arr.sort((a, b) => parseFloat(a.mrp) - parseFloat(b.mrp)));
                setBrandsMap(bMap);

                // Map medicines to frontend format with actual prices; only show medicines that have at least one available brand (and thus a price)
                const mappedProducts = medicinesResponse.items
                    .map(med => {
                        const mapped = mapMedicineToFrontend(med);
                        mapped.price = priceMap[med.id] || 0;
                        mapped.therapeutic_category_name = med.medicine_category_name || '';
                        const inStockBrands = (bMap[med.id] || []).length;
                        mapped.stock = med.is_active !== false && inStockBrands > 0;
                        return mapped;
                    })
                    .filter(p => p.price > 0 && p.stock);
                setProducts(mappedProducts);
                
                const categoryNames = (therapeuticCategoriesResponse.items || []).map((c) => c.name).filter(Boolean);
                setDynamicCategories(categoryNames);
                
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
                const response = await getMedicines({ search: query, limit: 5, is_available: true });
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

    // Brand modal: reset selection when opened
    useEffect(() => {
        if (!brandSelectorProduct) {
            setBrandModalSelectedId(null);
            setBrandModalQty(1);
            return;
        }
        const list = (brandsMap[brandSelectorProduct.id] || []).filter(isBrandPurchasable);
        const first = list[0];
        setBrandModalSelectedId(first?.id ?? null);
        setBrandModalQty(1);
    }, [brandSelectorProduct, brandsMap]);

    // Keep modal quantity within stock for the selected brand
    useEffect(() => {
        if (!brandSelectorProduct || !brandModalSelectedId) return;
        const br = (brandsMap[brandSelectorProduct.id] || []).find((b) => b.id === brandModalSelectedId);
        if (!br) return;
        const max = brandStockQuantity(br);
        setBrandModalQty((q) => Math.min(Math.max(1, q), Math.max(1, max)));
    }, [brandModalSelectedId, brandSelectorProduct, brandsMap]);

    useEffect(() => {
        if (!brandSelectorProduct) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setBrandSelectorProduct(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [brandSelectorProduct]);

    // Handle add to cart - show brand selector if multiple brands
    const handleAddToCart = (prod) => {
        const brands = (brandsMap[prod.id] || []).filter(isBrandPurchasable);
        if (brands.length === 0) {
            toast.error('This product is out of stock for all available brands.');
            return;
        }
        if (brands.length <= 1) {
            const brand = brands[0];
            const max = brandStockQuantity(brand);
            const cartItem = {
                ...prod,
                medicineId: prod.id,
                price: brand ? parseFloat(brand.mrp) : prod.price,
                brandName: brand?.brand_name || null,
                manufacturer: brand?.manufacturer || null,
                brandId: brand?.id || null,
                maxStock: max > 0 ? max : undefined,
                requiresPrescription: prod.requiresPrescription === true,
            };
            addToCart(cartItem, { quantity: 1 });
            toast.success(`${prod.name} added to cart`);
        } else {
            setBrandSelectorProduct(prod);
        }
    };

    const handleBrandSelect = (prod, brand, qty = 1) => {
        if (!isBrandPurchasable(brand)) {
            toast.error('This brand is out of stock.');
            return;
        }
        const max = brandStockQuantity(brand);
        const safeQty = Math.min(Math.max(1, Math.floor(Number(qty)) || 1), max);
        if (safeQty < 1) {
            toast.error('No units available for this brand.');
            return;
        }
        const cartItem = {
            ...prod,
            id: `${prod.id}_${brand.id}`,
            medicineId: prod.id,
            price: parseFloat(brand.mrp),
            brandName: brand.brand_name,
            manufacturer: brand.manufacturer,
            brandId: brand.id,
            name: `${prod.name} (${brand.brand_name})`,
            maxStock: max > 0 ? max : undefined,
            requiresPrescription: prod.requiresPrescription === true,
        };
        addToCart(cartItem, { quantity: safeQty });
        toast.success(`${safeQty} × ${brand.brand_name} added to cart`);
        setBrandSelectorProduct(null);
    };

    const confirmBrandModalAdd = () => {
        if (!brandSelectorProduct || !brandModalSelectedId) {
            toast.error('Select a brand to continue.');
            return;
        }
        const brand = (brandsMap[brandSelectorProduct.id] || []).find((b) => b.id === brandModalSelectedId);
        if (!brand || !isBrandPurchasable(brand)) {
            toast.error('Choose an in-stock brand.');
            return;
        }
        const max = brandStockQuantity(brand);
        const qty = Math.min(Math.max(1, brandModalQty), max);
        if (qty < 1 || max < 1) {
            toast.error('No units available for this brand.');
            return;
        }
        handleBrandSelect(brandSelectorProduct, brand, qty);
    };

    const bumpCardQty = (line, delta) => {
        const max = line.maxStock != null ? Number(line.maxStock) : null;
        const next = line.quantity + delta;
        if (next < 1) {
            removeFromCart(line.id);
            return;
        }
        if (delta > 0 && max != null && !Number.isNaN(max) && line.quantity >= max) {
            toast.info(`Only ${max} unit(s) in stock for this brand.`);
            return;
        }
        if (delta > 0 && max != null && !Number.isNaN(max) && next > max) {
            toast.info(`Only ${max} unit(s) in stock for this brand.`);
            updateQuantity(line.id, max);
            return;
        }
        updateQuantity(line.id, next);
    };

    /** Direct qty entry on card; 0 removes the line */
    const setCardLineQtyFromInput = (line, raw) => {
        const s = String(raw).trim();
        if (s === '') return;
        const n = parseInt(s, 10);
        if (Number.isNaN(n)) return;
        if (n < 1) {
            removeFromCart(line.id);
            return;
        }
        const max = line.maxStock != null ? Number(line.maxStock) : null;
        if (max != null && !Number.isNaN(max) && n > max) {
            toast.info(`Only ${max} unit(s) in stock for this brand.`);
            updateQuantity(line.id, max);
            return;
        }
        updateQuantity(line.id, n);
    };

    /** Delivery on/off is enforced at checkout (single source of truth for live settings). */
    const isOrderAllowed = () => true;

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
        const matchesCategory = activeCategory === 'All' || (p.therapeutic_category_name || '') === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const skeletonSlots = 12;

    return (
        <div className="pharmacy-page animate-fade">
            <header className="page-header pharmacy-header" aria-label="Pharmacy catalog">
                <div className="container">
                    <div className="pharmacy-header-content">
                        <div className="header-text">
                            <p className="pharmacy-hero-eyebrow">Catalog</p>
                            <h1 className="pharmacy-hero-title">Online Pharmacy</h1>
                            <p className="pharmacy-hero-subtitle">Genuine medicines, verified sourcing, doorstep delivery.</p>
                        </div>
                        <button type="button" className="cart-trigger" onClick={() => setIsCartOpen(true)} aria-label={`Open cart, ${cart.length} items`}>
                            <ShoppingCart size={22} aria-hidden />
                            <span className="cart-count">{cart.length}</span>
                            <div className="cart-total">₹{subtotal.toFixed(2)}</div>
                        </button>
                    </div>
                </div>
            </header>

            <section className="section shop-section pharmacy-main">
                <div className="container">
                    <div className="pharmacy-panel">
                        <div className="pharmacy-panel__toolbar">
                            <div className="shop-controls pharmacy-toolbar-row">
                                <div ref={searchRef} className="pharmacy-search-wrap">
                                    <div className="search-bar pharmacy-search-bar">
                                        <Search className="search-icon" size={20} aria-hidden />
                                        <input
                                            type="search"
                                            placeholder="Search medicines by name…"
                                            value={searchTerm}
                                            onChange={(e) => handleSearchInput(e.target.value)}
                                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                            autoComplete="off"
                                            aria-label="Search medicines"
                                        />
                                    </div>
                                    {showSuggestions && (
                                        <div className="pharmacy-suggestions" role="listbox" aria-label="Search suggestions">
                                            {suggestionsLoading && (
                                                <div className="pharmacy-suggestions__row pharmacy-suggestions__row--muted">
                                                    <InlineSpinner size={16} />
                                                    Searching…
                                                </div>
                                            )}
                                            {!suggestionsLoading && suggestions.length === 0 && searchTerm.length >= 2 && (
                                                <div className="pharmacy-suggestions__row pharmacy-suggestions__row--muted">
                                                    No medicines found
                                                </div>
                                            )}
                                            {!suggestionsLoading && suggestions.map((med) => (
                                                <button
                                                    type="button"
                                                    key={med.id}
                                                    className="pharmacy-suggestions__item"
                                                    onClick={() => handleSuggestionClick(med)}
                                                >
                                                    <div className="pharmacy-suggestions__text">
                                                        <span className="pharmacy-suggestions__name">{med.name}</span>
                                                        <span className="pharmacy-suggestions__meta">{med.category}</span>
                                                    </div>
                                                    {med.price > 0 && (
                                                        <span className="pharmacy-suggestions__price">₹{med.price}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="custom-dropdown" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="listbox"
                                    >
                                        <Filter size={18} className="filter-icon" aria-hidden />
                                        <span>{activeCategory === 'All' ? 'All categories' : activeCategory}</span>
                                        <ChevronDown size={16} className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} aria-hidden />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="dropdown-menu animate-slide-down" role="listbox">
                                            {categories.map(cat => (
                                                <div
                                                    key={cat}
                                                    role="option"
                                                    aria-selected={activeCategory === cat}
                                                    className={`dropdown-item ${activeCategory === cat ? 'selected' : ''}`}
                                                    onClick={() => handleFilterChange('category', cat)}
                                                >
                                                    {cat === 'All' ? 'All categories' : cat}
                                                    {activeCategory === cat && <Check size={14} className="check-icon" aria-hidden />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!loading && !error && (
                                <div className="pharmacy-results-meta" aria-live="polite">
                                    <span className="pharmacy-results-meta__label">Showing</span>
                                    <strong>{filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong>
                                    <span className="pharmacy-results-meta__of">of</span>
                                    <strong>{filteredProducts.length}</strong>
                                    <span className="pharmacy-results-meta__suffix">products</span>
                                    {searchTerm.trim() && (
                                        <span className="pharmacy-results-meta__filter">matching “{searchTerm.trim()}”</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {loading && (
                            <div className="pharmacy-grid-wrap" aria-busy="true" aria-label="Loading catalog">
                                <div className="product-grid pharmacy-product-grid pharmacy-product-grid--skeleton">
                                    {Array.from({ length: skeletonSlots }).map((_, i) => (
                                        <div key={i} className="pharmacy-skeleton-card">
                                            <div className="pharmacy-skeleton-card__media" />
                                            <div className="pharmacy-skeleton-card__body">
                                                <div className="pharmacy-skeleton-line pharmacy-skeleton-line--sm" />
                                                <div className="pharmacy-skeleton-line pharmacy-skeleton-line--lg" />
                                                <div className="pharmacy-skeleton-line pharmacy-skeleton-line--md" />
                                                <div className="pharmacy-skeleton-card__actions">
                                                    <div className="pharmacy-skeleton-pill" />
                                                    <div className="pharmacy-skeleton-pill pharmacy-skeleton-pill--ghost" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pharmacy-loading-caption">
                                    <InlineSpinner size={18} />
                                    <span>Loading catalog…</span>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="pharmacy-alert pharmacy-alert--error">
                                <AlertCircle size={20} aria-hidden />
                                <span>Error loading products: {error}</span>
                            </div>
                        )}
                        {!loading && !error && products.length === 0 && (
                            <div className="pharmacy-empty">
                                <ShoppingBag size={44} className="pharmacy-empty__icon" aria-hidden />
                                <p className="pharmacy-empty__title">No products available</p>
                                <p className="pharmacy-empty__text">Check back soon or contact the pharmacy for availability.</p>
                            </div>
                        )}

                        {!loading && !isOrderAllowed() && (
                            <div className="pharmacy-alert pharmacy-alert--notice">
                                <Clock size={20} aria-hidden />
                                <span>Home delivery is currently unavailable. You can still browse the catalog.</span>
                            </div>
                        )}

                        {!loading && !error && products.length > 0 && (
                    <>
                    <div className="product-grid pharmacy-product-grid">
                        {paginatedProducts.map((prod) => {
                            const brandsForCard = (brandsMap[prod.id] || []).filter(isBrandPurchasable);
                            const packNoteSingle =
                                brandsForCard.length === 1
                                    ? String(brandsForCard[0]?.description || '').trim()
                                    : '';
                            return (
                            <article key={prod.id} className="product-card">
                                <div className="product-image">
                                    <div className="product-image__inner">
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.name} className="product-img-render" loading="lazy" decoding="async" />
                                    ) : (
                                        <ShoppingBag size={52} className="placeholder-icon" aria-hidden />
                                    )}
                                    </div>
                                    {prod.requiresPrescription && <span className="prescription-badge">Rx required</span>}
                                    {!prod.stock && <div className="out-of-stock">Out of stock</div>}
                                </div>
                                <div className="product-info">
                                    <span className="p-cat">{prod.category}</span>
                                    <h3 className="product-card__title">{prod.name}</h3>
                                    {brandsForCard.length === 1 ? (
                                        <p className="product-card__brand-trade">
                                            <span className="product-card__brand-trade__label">Brand</span>
                                            <span className="product-card__brand-trade__name">
                                                {brandsForCard[0]?.brand_name?.trim() || '—'}
                                            </span>
                                        </p>
                                    ) : null}
                                    {packNoteSingle ? (
                                        <p className="product-card__pack">
                                            <span className="product-card__pack-label">Pack contains</span>
                                            <span className="product-card__pack-value">{packNoteSingle}</span>
                                        </p>
                                    ) : null}
                                    <div className="product-card__commerce">
                                    <div className="p-price">
                                        {prod.price > 0 ? (
                                            <>
                                                <span className="current">
                                                    {brandsForCard.length > 1 ? 'from ' : ''}₹
                                                    {brandsForCard.length === 1
                                                        ? parseFloat(brandsForCard[0]?.mrp ?? prod.price).toFixed(2)
                                                        : prod.price.toFixed(2)}
                                                </span>
                                                {brandsForCard.length > 1 && (
                                                    <span className="brand-count">{brandsForCard.length} brands</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="current" style={{ color: 'var(--gray-400)' }}>Price N/A</span>
                                        )}
                                    </div>
                                    <div className="pharmacy-card-actions-wrap">
                                        {(() => {
                                            const linesMed = cartLinesForMedicine(cart, prod.id);
                                            const oneLine = linesMed.length === 1 ? linesMed[0] : null;
                                            const multiLines = linesMed.length > 1;
                                            const unitsTotal = totalUnitsForMedicineLines(linesMed);
                                            return (
                                        <div className="card-actions pharmacy-card-actions">
                                            {oneLine ? (
                                                <div className="card-qty-controls">
                                                    <button
                                                        type="button"
                                                        className="card-qty-btn"
                                                        onClick={() => bumpCardQty(oneLine, -1)}
                                                        aria-label="Decrease quantity (removes item at zero)"
                                                    >
                                                        <Minus size={14} strokeWidth={2.5} aria-hidden />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={0}
                                                        max={
                                                            oneLine.maxStock != null
                                                                ? Number(oneLine.maxStock)
                                                                : undefined
                                                        }
                                                        className="card-qty-input"
                                                        aria-label="Quantity"
                                                        value={oneLine.quantity}
                                                        onChange={(e) => setCardLineQtyFromInput(oneLine, e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="card-qty-btn"
                                                        disabled={
                                                            oneLine.maxStock != null &&
                                                            oneLine.quantity >= Number(oneLine.maxStock)
                                                        }
                                                        onClick={() => bumpCardQty(oneLine, 1)}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={14} strokeWidth={2.5} aria-hidden />
                                                    </button>
                                                </div>
                                            ) : multiLines ? (
                                                <button
                                                    type="button"
                                                    className="add-btn pharmacy-cart-multi-btn"
                                                    onClick={() => setIsCartOpen(true)}
                                                >
                                                    {unitsTotal} in cart
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="add-btn"
                                                    disabled={!prod.stock || !isOrderAllowed()}
                                                    onClick={() => handleAddToCart(prod)}
                                                >
                                                    <ShoppingCart size={13} aria-hidden />
                                                    {prod.stock ? 'Add' : 'Out of stock'}
                                                </button>
                                            )}
                                        </div>
                                            );
                                        })()}
                                    </div>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination pharmacy-pagination">
                            <button
                                type="button"
                                className="page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Previous
                            </button>

                            <div className="page-numbers">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        type="button"
                                        key={i + 1}
                                        className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="page-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                    </>
                        )}
                    </div>
                </div>
            </section>

            {brandSelectorProduct && (
                <div
                    className="pharmacy-brand-modal-backdrop"
                    role="presentation"
                    onClick={() => setBrandSelectorProduct(null)}
                >
                    <div
                        ref={brandModalRef}
                        className="pharmacy-brand-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pharmacy-brand-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pharmacy-brand-modal__head">
                            <div className="pharmacy-brand-modal__head-text">
                                <Package size={22} aria-hidden />
                                <div>
                                    <h2 id="pharmacy-brand-modal-title" className="pharmacy-brand-modal__title">
                                        Which brand do you want?
                                    </h2>
                                    <p className="pharmacy-brand-modal__subtitle">{brandSelectorProduct.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="pharmacy-brand-modal__close"
                                onClick={() => setBrandSelectorProduct(null)}
                                aria-label="Close"
                            >
                                <X size={20} aria-hidden />
                            </button>
                        </div>
                        <div className="pharmacy-brand-modal__body">
                            <fieldset className="pharmacy-brand-modal__fieldset">
                                <legend className="sr-only">Available brands</legend>
                                {(brandsMap[brandSelectorProduct.id] || [])
                                    .filter(isBrandPurchasable)
                                    .map((brand) => {
                                        const sel = brandModalSelectedId === brand.id;
                                        const packText = String(brand.description || '').trim();
                                        return (
                                            <label
                                                key={brand.id}
                                                className={`pharmacy-brand-row ${sel ? 'pharmacy-brand-row--selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="pharmacy-brand-pick"
                                                    className="pharmacy-brand-row__radio"
                                                    checked={sel}
                                                    onChange={() => setBrandModalSelectedId(brand.id)}
                                                />
                                                <div className="pharmacy-brand-row__main">
                                                    <span className="pharmacy-brand-row__name">{brand.brand_name}</span>
                                                    {brand.manufacturer && (
                                                        <span className="pharmacy-brand-row__mfg">{brand.manufacturer}</span>
                                                    )}
                                                    <span className="pharmacy-brand-row__pack">
                                                        <span className="pharmacy-brand-row__pack-label">Pack contains</span>
                                                        <span className={`pharmacy-brand-row__pack-value ${packText ? '' : 'pharmacy-brand-row__pack-value--empty'}`}>
                                                            {packText || '—'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <span className="pharmacy-brand-row__price">
                                                    ₹{parseFloat(brand.mrp).toFixed(2)}
                                                </span>
                                            </label>
                                        );
                                    })}
                            </fieldset>
                            {brandModalSelectedId && (() => {
                                const b = (brandsMap[brandSelectorProduct.id] || []).find((x) => x.id === brandModalSelectedId);
                                if (!b) return null;
                                const maxQ = brandStockQuantity(b);
                                return (
                                    <div className="pharmacy-brand-modal__qty-block">
                                        <span className="pharmacy-brand-modal__qty-label" id="brand-qty-label">
                                            Order quantity (maximum {maxQ})
                                        </span>
                                        <div className="pharmacy-brand-modal__qty-controls" role="group" aria-labelledby="brand-qty-label">
                                            <button
                                                type="button"
                                                className="pharmacy-brand-modal__qty-btn"
                                                disabled={brandModalQty <= 1}
                                                onClick={() => setBrandModalQty((q) => Math.max(1, q - 1))}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={16} aria-hidden />
                                            </button>
                                            <input
                                                type="number"
                                                className="pharmacy-brand-modal__qty-input"
                                                min={1}
                                                max={maxQ}
                                                value={brandModalQty}
                                                onChange={(e) => {
                                                    const v = parseInt(e.target.value, 10);
                                                    if (Number.isNaN(v)) return;
                                                    setBrandModalQty(Math.min(Math.max(1, v), maxQ));
                                                }}
                                                aria-valuemin={1}
                                                aria-valuemax={maxQ}
                                            />
                                            <button
                                                type="button"
                                                className="pharmacy-brand-modal__qty-btn"
                                                disabled={brandModalQty >= maxQ}
                                                onClick={() => setBrandModalQty((q) => Math.min(maxQ, q + 1))}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={16} aria-hidden />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="pharmacy-brand-modal__footer">
                            <button
                                type="button"
                                className="pharmacy-brand-modal__btn-secondary"
                                onClick={() => setBrandSelectorProduct(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="pharmacy-brand-modal__btn-primary"
                                onClick={confirmBrandModalAdd}
                                disabled={!isOrderAllowed()}
                            >
                                Add to cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pharmacy;
