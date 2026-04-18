import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getMedicineById } from '../services/medicinesApi';
import { getTherapeuticCategoryById } from '../services/therapeuticCategoriesApi';
import {
  ArrowLeft,
  ShoppingCart,
  Pill,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Package,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { safeError } from '../utils/logger';
import { getStorageFileUrl } from '../utils/prescriptionUrl';
import { isBrandPurchasable, brandStockQuantity } from '../utils/pharmacyStock';
import { PageLoading } from '../components/common/PageLoading';

const MedicineDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [medicine, setMedicine] = useState(null);
  const [brands, setBrands] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [noBuyableBrands, setNoBuyableBrands] = useState(false);

  useEffect(() => {
    const fetchMedicineDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const medicineData = await getMedicineById(id, { include_brands: true });
        setMedicine(medicineData);
        const rawBrands = medicineData.brands || [];
        const buyable = rawBrands.filter(isBrandPurchasable);
        setBrands(buyable);
        setNoBuyableBrands(rawBrands.length > 0 && buyable.length === 0);
        setSelectedBrand(buyable.length === 1 ? buyable[0] : null);

        // Fetch therapeutic category name
        if (medicineData.medicine_category_id) {
          try {
            const categoryData = await getTherapeuticCategoryById(
              medicineData.medicine_category_id
            );
            setCategory(categoryData);
          } catch {
            // Category fetch failed; not critical
          }
        }
      } catch (err) {
        safeError('Error fetching medicine detail:', err);
        setError(err?.message || 'Failed to load medicine details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedicineDetail();
    }
  }, [id]);

    const handleAddToCart = (brand) => {
    if (!medicine) return;
    const chosenBrand = brand || selectedBrand || (brands.length > 0 ? brands[0] : null);
    const stockQty = chosenBrand ? brandStockQuantity(chosenBrand) : null;
    if (chosenBrand && stockQty !== null && stockQty < 1) {
      setError('This brand is out of stock. Try another brand for availability.');
      return;
    }

    const imgUrl = medicine.image_path ? getStorageFileUrl(medicine.image_path) : '';
    const cartProduct = {
      id: chosenBrand ? `${medicine.id}_${chosenBrand.id}` : medicine.id,
      medicineId: medicine.id,
      name: chosenBrand ? `${medicine.name} (${chosenBrand.brand_name})` : medicine.name,
      category: medicine.schedule_type || 'OTC',
      price: chosenBrand ? parseFloat(chosenBrand.mrp) : (medicine.min_price || 0),
      discount: 0,
      description: medicine.description || '',
      requiresPrescription: medicine.is_prescription_required || false,
      image: imgUrl,
      stock: medicine.is_active !== false,
      brandName: chosenBrand?.brand_name || null,
      manufacturer: chosenBrand?.manufacturer || null,
      brandId: chosenBrand?.id || null,
      maxStock: stockQty != null && stockQty > 0 ? stockQty : undefined,
    };

    addToCart(cartProduct);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const getPrice = () => {
    if (brands.length > 0) {
      const prices = brands.map((b) => parseFloat(b.mrp));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) return `₹${min.toFixed(2)}`;
      return `₹${min.toFixed(2)} - ₹${max.toFixed(2)}`;
    }
    if (medicine?.min_price) return `₹${parseFloat(medicine.min_price).toFixed(2)}`;
    return null;
  };

  const isInStock =
    medicine?.is_active !== false &&
    !noBuyableBrands &&
    (brands.length > 0 || !(medicine?.brands && medicine.brands.length > 0));

  // --- Loading State ---
  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <PageLoading
            variant="page"
            message="Loading medicine details…"
            className="medicine-detail-page-loading"
          />
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <AlertCircle size={48} style={{ color: '#f5222d', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>Something went wrong</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>{error}</p>
            <Link to="/pharmacy" style={styles.backLink}>
              <ArrowLeft size={18} />
              Back to Pharmacy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!medicine) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.errorContainer}>
            <Package size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>Medicine Not Found</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
              The medicine you are looking for does not exist or has been removed.
            </p>
            <Link to="/pharmacy" style={styles.backLink}>
              <ArrowLeft size={18} />
              Back to Pharmacy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priceDisplay = getPrice();
  const medicineImageUrl = medicine.image_path ? getStorageFileUrl(medicine.image_path) : '';

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Back navigation */}
        <Link to="/pharmacy" style={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Pharmacy
        </Link>

        {/* Main card */}
        <div style={styles.card}>
          {medicineImageUrl ? (
            <div style={styles.heroImageWrap}>
              <img src={medicineImageUrl} alt={medicine.name} style={styles.heroImage} />
            </div>
          ) : null}
          {/* Header section */}
          <div style={styles.cardHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.iconCircle}>
                <Pill size={32} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h1 style={styles.medicineName}>{medicine.name}</h1>
                <p style={styles.dosageForm}>{medicine.dosage_form}</p>
              </div>
            </div>
            <div style={styles.headerRight}>
              {/* Stock status */}
              {isInStock ? (
                <span style={styles.inStockBadge}>
                  <CheckCircle size={14} />
                  In Stock
                </span>
              ) : (
                <span style={styles.outOfStockBadge}>
                  <XCircle size={14} />
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div style={styles.badgesRow}>
            {medicine.is_prescription_required && (
              <span style={styles.prescriptionBadge}>
                <ShieldAlert size={14} />
                Prescription Required
              </span>
            )}
            {medicine.is_controlled && (
              <span style={styles.controlledBadge}>
                <ShieldCheck size={14} />
                Controlled Substance
              </span>
            )}
            {medicine.schedule_type && (
              <span style={styles.scheduleBadge}>
                <Tag size={14} />
                {medicine.schedule_type}
              </span>
            )}
          </div>

          {/* Details grid */}
          <div style={styles.detailsGrid}>
            {/* Price section */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Price</h3>
              {priceDisplay ? (
                <p style={styles.priceText}>{priceDisplay}</p>
              ) : (
                <p style={styles.unavailableText}>Price not available</p>
              )}
            </div>

            {/* Category section */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Therapeutic Category</h3>
              <p style={styles.detailValue}>
                {category?.name || 'Not specified'}
              </p>
            </div>

            {/* Schedule type */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Schedule Type</h3>
              <p style={styles.detailValue}>{medicine.schedule_type || 'N/A'}</p>
            </div>

            {/* Dosage form */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Dosage Form</h3>
              <p style={styles.detailValue}>{medicine.dosage_form || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          {medicine.description && (
            <div style={styles.descriptionSection}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.descriptionText}>{medicine.description}</p>
            </div>
          )}

          {/* Available Brands - Pick & Add */}
          {brands.length > 0 && (
            <div style={styles.brandsSection}>
              <h3 style={styles.sectionTitle}>
                <Package size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Available Brands — Select to Add
              </h3>
              <div style={styles.brandsGrid}>
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    style={{
                      ...styles.brandCard,
                      ...(selectedBrand?.id === brand.id ? styles.brandCardSelected : {}),
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <div style={styles.brandName}>{brand.brand_name}</div>
                    <div style={styles.brandManufacturer}>{brand.manufacturer}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.35rem' }}>
                      {brandStockQuantity(brand)} unit(s) available
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <div style={styles.brandPrice}>₹{parseFloat(brand.mrp).toFixed(2)}</div>
                      <button
                        style={{
                          ...styles.brandAddBtn,
                          ...(addedToCart ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                        }}
                        disabled={addedToCart}
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(brand); }}
                      >
                        <ShoppingCart size={14} />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brands.length === 0 && noBuyableBrands && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={22} style={{ color: '#cf1322', flexShrink: 0 }} />
              <p style={{ margin: 0, color: '#5c0011', fontWeight: 600, lineHeight: 1.5 }}>
                This medicine has no stock for any brand right now. Check back later or browse alternatives.
              </p>
            </div>
          )}

          {/* Add to Cart button (medicines with no brand offerings in catalog) */}
          {brands.length === 0 && !noBuyableBrands && (
            <div style={styles.actionSection}>
              <button
                style={{
                  ...styles.addToCartButton,
                  ...((!isInStock || addedToCart) ? styles.addToCartDisabled : {}),
                }}
                disabled={!isInStock || addedToCart}
                onClick={() => handleAddToCart(null)}
              >
                <ShoppingCart size={20} />
                {addedToCart
                  ? 'Added to Cart!'
                  : isInStock
                    ? 'Add to Cart'
                    : 'Out of Stock'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframes injected once */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// --------------- Inline Styles ---------------

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'var(--gray-50, #f8f9fa)',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--primary)',
    fontWeight: 700,
    textDecoration: 'none',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
    transition: 'opacity 0.2s',
  },
  card: {
    background: 'var(--white, #fff)',
    borderRadius: 'var(--radius-lg, 16px)',
    boxShadow: 'var(--shadow, 0 2px 8px rgba(0,0,0,0.08))',
    border: '1px solid var(--gray-100, #f0f0f0)',
    overflow: 'hidden',
    padding: '2rem',
  },
  heroImageWrap: {
    margin: '-2rem -2rem 1.25rem -2rem',
    maxHeight: '280px',
    background: 'var(--gray-50, #f8f9fa)',
    borderBottom: '1px solid var(--gray-100, #f0f0f0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    maxHeight: '280px',
    objectFit: 'contain',
    display: 'block',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--primary-light, #e6f0ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medicineName: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1a1a2e',
    margin: 0,
    lineHeight: 1.3,
  },
  dosageForm: {
    fontSize: '0.95rem',
    color: 'var(--gray-500, #6b7280)',
    margin: '0.25rem 0 0 0',
    fontWeight: 600,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  inStockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    background: '#f6ffed',
    color: '#52c41a',
    fontWeight: 700,
    fontSize: '0.8rem',
    border: '1px solid #b7eb8f',
  },
  outOfStockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    background: '#fff1f0',
    color: '#f5222d',
    fontWeight: 700,
    fontSize: '0.8rem',
    border: '1px solid #ffa39e',
  },
  badgesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  prescriptionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    background: '#fff1f0',
    color: '#f5222d',
    fontWeight: 700,
    fontSize: '0.75rem',
    border: '1px solid #ffa39e',
  },
  controlledBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    background: '#fff7e6',
    color: '#d46b08',
    fontWeight: 700,
    fontSize: '0.75rem',
    border: '1px solid #ffd591',
  },
  scheduleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    background: 'var(--primary-light, #e6f0ff)',
    color: 'var(--primary, #0056b3)',
    fontWeight: 700,
    fontSize: '0.75rem',
    border: '1px solid #91caff',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'var(--gray-50, #f8f9fa)',
    borderRadius: 'var(--radius, 8px)',
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--gray-500, #6b7280)',
    fontWeight: 700,
    margin: 0,
  },
  detailValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0,
  },
  priceText: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--primary, #0056b3)',
    margin: 0,
  },
  unavailableText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--gray-400, #9ca3af)',
    fontStyle: 'italic',
    margin: 0,
  },
  descriptionSection: {
    marginBottom: '2rem',
  },
  descriptionText: {
    fontSize: '0.95rem',
    color: 'var(--gray-600, #4b5563)',
    lineHeight: 1.6,
    marginTop: '0.5rem',
  },
  brandsSection: {
    marginBottom: '2rem',
  },
  brandsGrid: {
    marginTop: '0.75rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  brandCard: {
    padding: '1rem',
    background: 'var(--gray-50, #f8f9fa)',
    borderRadius: 'var(--radius, 8px)',
    border: '2px solid var(--gray-100, #f0f0f0)',
    transition: 'all 0.2s',
  },
  brandCardSelected: {
    borderColor: 'var(--primary, #0056b3)',
    background: 'var(--primary-light, #e6f0ff)',
    boxShadow: '0 0 0 3px rgba(0, 86, 179, 0.1)',
  },
  brandAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.4rem 0.75rem',
    background: 'var(--primary, #0056b3)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  brandName: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1a1a2e',
    marginBottom: '0.25rem',
  },
  brandManufacturer: {
    fontSize: '0.8rem',
    color: 'var(--gray-500, #6b7280)',
    marginBottom: '0.5rem',
  },
  brandPrice: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--primary, #0056b3)',
  },
  actionSection: {
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--gray-100, #f0f0f0)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  addToCartButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.85rem 2rem',
    background: 'var(--primary, #0056b3)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius, 8px)',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  addToCartDisabled: {
    background: 'var(--gray-200, #e5e7eb)',
    color: 'var(--gray-400, #9ca3af)',
    cursor: 'not-allowed',
  },
};

export default MedicineDetail;
