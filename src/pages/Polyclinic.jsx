import React, { useState, useEffect } from 'react';
import LocationSection from '../components/common/LocationSection';
import { TestTube, Activity, Droplet, Heart, Stethoscope, Microscope, FileText, Calendar, Phone, Loader2, AlertCircle } from 'lucide-react';
import { getPolyclinicTests } from '../services/polyclinicTestsApi';
import { safeError } from '../utils/logger';
import './Polyclinic.css';

const iconMap = {
    TestTube,
    Activity,
    Droplet,
    Heart,
    Stethoscope,
    Microscope,
    FileText,
    Calendar,
    Phone,
};

const Polyclinic = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getPolyclinicTests({ limit: 100 });
                const list = response?.items ?? [];
                const validTests = list.filter((t) => t && (t.id || t.name));
                setTests(validTests);
            } catch (err) {
                safeError('Error fetching polyclinic tests:', err);
                setError(err?.message || 'Failed to load tests');
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || TestTube;
        return <IconComponent size={32} />;
    };

    return (
        <div className="polyclinic-page animate-fade">
            <header className="page-header polyclinic-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Polyclinic Services</h1>
                    <p>Comprehensive diagnostic tests and health checkups under one roof.</p>
                </div>
            </header>

            {/* Tests Section */}
            <section className="section tests-section">
                <div className="container">
                    <div className="section-header-compact">
                        <h2>Available Tests & Services</h2>
                        <p>Book your diagnostic tests with us. Fast, accurate, and affordable healthcare diagnostics.</p>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: '1rem' }}>Loading tests...</p>
                        </div>
                    )}

                    {error && (
                        <div className="time-alert" style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
                            <AlertCircle size={20} />
                            <span>Error loading tests: {error}</span>
                        </div>
                    )}

                    {!loading && !error && tests.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <TestTube size={48} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                            <p>No tests available at the moment.</p>
                        </div>
                    )}

                    {!loading && !error && tests.length > 0 && (
                        <div className="tests-grid">
                            {tests.map((test, index) => (
                                <div key={test.id || `test-${index}`} className="test-card">
                                    <div className="test-icon-wrapper">
                                        {getIcon(test.icon_name)}
                                    </div>
                                    <div className="test-content">
                                        <h3>{test.name || 'Test'}</h3>
                                        <p className="test-description">{test.description || 'Diagnostic test service'}</p>
                                        <div className="test-details">
                                            <div className="test-detail-item">
                                                <span className="detail-label">Price:</span>
                                                <span className="detail-value">{'\u20B9'}{parseFloat(test.price || 0).toFixed(2)}</span>
                                            </div>
                                            {test.duration && (
                                                <div className="test-detail-item">
                                                    <span className="detail-label">Duration:</span>
                                                    <span className="detail-value">{test.duration}</span>
                                                </div>
                                            )}
                                            {test.fasting_required && (
                                                <div className="test-fasting-badge">
                                                    <span>Fasting Required</span>
                                                </div>
                                            )}
                                        </div>
                                        <a
                                            href="tel:+919894880598"
                                            className="btn-book-test"
                                        >
                                            <Phone size={18} />
                                            Call to Book Test
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Booking Information Section */}
            <section className="section booking-info-section">
                <div className="container">
                    <div className="booking-info-card">
                        <div className="booking-info-icon">
                            <Phone size={32} />
                        </div>
                        <div className="booking-info-content">
                            <h3>Book Your Test</h3>
                            <p>Call us directly to schedule your diagnostic test. Our staff will guide you through the process.</p>
                            <a href="tel:+919894880598" className="booking-phone-link">
                                <Phone size={20} />
                                +91 9894880598
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <LocationSection />
        </div>
    );
};

export default Polyclinic;
