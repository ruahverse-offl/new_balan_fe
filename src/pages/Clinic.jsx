import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LocationSection from '../components/common/LocationSection';
import { CheckCircle2, ArrowRight, Phone, Stethoscope, IndianRupee, TestTube } from 'lucide-react';
import { PageLoading } from '../components/common/PageLoading';
import { getDoctors } from '../services/doctorsApi';
import { mapDoctorToFrontend } from '../utils/dataMapper';
import { formatTimeRangeTo12h } from '../utils/timeFormatters';
import './Clinic.css';

const Clinic = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const clinicPhone = '+919894880598';

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getDoctors({ limit: 100 });
                const list = response?.items ?? [];
                const mappedDoctors = list
                    .map(mapDoctorToFrontend)
                    .filter(Boolean);
                setDoctors(mappedDoctors);
            } catch (err) {
                console.error('Error fetching doctors:', err);
                setError(err.message || 'Failed to load doctors');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    const handlePhoneBooking = (e, doctorName) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`tel:${clinicPhone}`, '_self');
    };

    const formatFee = (fee) => {
        if (fee == null || isNaN(fee)) return null;
        return `₹${Number(fee).toFixed(0)}`;
    };

    return (
        <div className="clinic-page animate-fade">
            <header className="page-header clinic-header clinic-hero">
                <div className="clinic-hero-pattern" aria-hidden="true" />
                <div className="container">
                    <span className="clinic-hero-badge">Expert Care</span>
                    <h1 style={{ color: '#fff' }}>Clinic Services</h1>
                    <p>Consult with our qualified specialists. Call to schedule your appointment.</p>
                </div>
            </header>

            {/* Features Strip */}
            <section className="clinic-features-strip">
                <div className="container">
                    <div className="clinic-features-grid">
                        <div className="clinic-feature-item">
                            <div className="clinic-feature-icon"><Stethoscope size={24} /></div>
                            <span>Qualified Specialists</span>
                        </div>
                        <div className="clinic-feature-item">
                            <div className="clinic-feature-icon"><Phone size={24} /></div>
                            <span>Call to Book</span>
                        </div>
                        <div className="clinic-feature-item">
                            <div className="clinic-feature-icon"><IndianRupee size={24} /></div>
                            <span>Affordable Consultations</span>
                        </div>
                        <div className="clinic-feature-item">
                            <div className="clinic-feature-icon"><CheckCircle2 size={24} /></div>
                            <span>Same-day Appointments</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Polyclinic Cross-link */}
            <section className="clinic-polyclinic-cta">
                <div className="container">
                    <Link to="/polyclinic" className="clinic-polyclinic-card">
                        <div className="clinic-polyclinic-icon">
                            <TestTube size={28} />
                        </div>
                        <div className="clinic-polyclinic-content">
                            <h3>Lab & Diagnostics</h3>
                            <p>Blood tests, imaging, and health checkups. Book your polyclinic tests.</p>
                        </div>
                        <ArrowRight size={20} className="clinic-polyclinic-arrow" />
                    </Link>
                </div>
            </section>

            {/* Available Specialists Section */}
            <section className="section doctors-section">
                <div className="container doctors-container-centered">
                    <div className="section-header-compact clinic-section-header">
                        <h2>Available Specialists</h2>
                        <p>Choose your doctor and call us to schedule your appointment.</p>
                    </div>
                    {loading && (
                        <div className="clinic-loading">
                            <PageLoading variant="bare" message="Loading doctors…" />
                        </div>
                    )}
                    {error && (
                        <div className="clinic-error">
                            <p>Error loading doctors: {error}</p>
                        </div>
                    )}
                    {!loading && !error && doctors.length === 0 && (
                        <div className="clinic-empty">
                            <Stethoscope size={48} />
                            <p>No doctors available at the moment.</p>
                        </div>
                    )}
                    <div className="doctors-list">
                        {doctors.map(doc => (
                            <div key={doc.id} className="professional-doc-card-wrapper">
                                <Link to={`/clinic/specialist/${doc.id}`} className="professional-doc-card-link">
                                    <div className="professional-doc-card">
                                        <div className="doc-profile-side">
                                            <div className="doc-avatar">
                                                <div className="avatar-circle">
                                                    {(doc.name || 'D').split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2) || 'D'}
                                                </div>
                                                <div className={`online-dot ${doc.available ? 'active' : 'inactive'}`} />
                                            </div>
                                            <div className={`status-pill ${doc.available ? 'online' : 'offline'}`}>
                                                {doc.available ? 'Available' : 'Currently Away'}
                                            </div>
                                            {doc.consultationFee != null && (
                                                <div className="doc-fee-badge">
                                                    <span className="doc-fee-label">Consultation</span>
                                                    <span className="doc-fee-value">{formatFee(doc.consultationFee)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="doc-content-side">
                                            <div className="doc-header-info">
                                                <h3>{doc.name}</h3>
                                                <div className="specialty-badge">{doc.specialty}</div>
                                            </div>
                                            <p className="doc-sub-text">{doc.subSpecialty || 'General Medical Consultant'}</p>
                                            <div className="doc-meta">
                                                <span className="meta-item"><CheckCircle2 size={14} /> {doc.qualification}</span>
                                            </div>
                                            <div className="timing-grid">
                                                <div className="timing-slot">
                                                    <span className="slot-label">Morning</span>
                                                    <span className="slot-time">{doc.morning ? formatTimeRangeTo12h(doc.morning) || doc.morning : '—'}</span>
                                                </div>
                                                <div className="timing-slot">
                                                    <span className="slot-label">Evening</span>
                                                    <span className="slot-time">{doc.evening ? formatTimeRangeTo12h(doc.evening) || doc.evening : '—'}</span>
                                                </div>
                                            </div>
                                            <div className="view-details-link">
                                                <span>View Details</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    className="btn-call-booking"
                                    onClick={(e) => handlePhoneBooking(e, doc.name)}
                                >
                                    <Phone size={18} />
                                    Call to Book
                                </button>
                            </div>
                        ))}
                    </div>
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
                            <h3>Book Your Appointment</h3>
                            <p>Call us directly to schedule your consultation with any of our specialists. We're here to help.</p>
                            <a href={`tel:${clinicPhone}`} className="booking-phone-link">
                                <Phone size={20} />
                                {clinicPhone}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <LocationSection />
        </div>
    );
};

export default Clinic;
