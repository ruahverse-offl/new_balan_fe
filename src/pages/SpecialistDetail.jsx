import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, Award, Phone, Mail, MapPin } from 'lucide-react';
import { getDoctorById } from '../services/doctorsApi';
import { mapDoctorToFrontend } from '../utils/dataMapper';
import { formatTimeRangeTo12h } from '../utils/timeFormatters';
import './SpecialistDetail.css';

const SpecialistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [specialist, setSpecialist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const doctor = await getDoctorById(id);
                setSpecialist(mapDoctorToFrontend(doctor));
            } catch (err) {
                console.error('Error fetching doctor:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchDoctor();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="specialist-detail-page">
                <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem' }}>Loading doctor details...</p>
                </div>
            </div>
        );
    }

    if (error || !specialist) {
        return (
            <div className="specialist-detail-page">
                <div className="container">
                    <div className="not-found">
                        <h2>Specialist Not Found</h2>
                        <p>{error || 'The specialist you\'re looking for doesn\'t exist.'}</p>
                        <Link to="/clinic" className="btn btn-primary">
                            <ArrowLeft size={18} />
                            Back to Clinic
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="specialist-detail-page animate-fade">
            <header className="page-header specialist-header">
                <div className="container">
                    <button className="back-link" onClick={() => navigate('/clinic')}>
                        <ArrowLeft size={20} />
                        Back to Specialists
                    </button>
                    <h1 style={{ color: '#fff' }}>{specialist.name}</h1>
                    <p>{specialist.specialty} • {specialist.subSpecialty || 'General Medical Consultant'}</p>
                </div>
            </header>

            <section className="section specialist-detail-section">
                <div className="container">
                    <div className="specialist-detail-grid">
                        <div className="specialist-profile-card">
                            <div className="profile-avatar-large">
                                <div className="avatar-circle-large">
                                    {specialist.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={`online-dot-large ${specialist.available ? 'active' : 'inactive'}`}></div>
                            </div>
                            
                            <div className={`status-badge-large ${specialist.available ? 'online' : 'offline'}`}>
                                {specialist.available ? 'Available Now' : 'Currently Away'}
                            </div>

                            <div className="profile-info">
                                <h2>{specialist.name}</h2>
                                <div className="specialty-badge-large">{specialist.specialty}</div>
                                <p className="sub-specialty">{specialist.subSpecialty || 'General Medical Consultant'}</p>
                                
                                <div className="qualification-info">
                                    <Award size={20} className="qual-icon" />
                                    <span>{specialist.qualification}</span>
                                </div>
                                {specialist.consultationFee != null && !isNaN(specialist.consultationFee) && (
                                    <div className="consultation-fee-info" style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: 'var(--gray-100)', borderRadius: '8px', display: 'inline-block' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Consultation Fee</span>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(specialist.consultationFee).toFixed(2)}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="specialist-content">
                            <div className="info-section">
                                <h3>About {specialist.name.split(' ')[0]}</h3>
                                <p className="about-text">
                                    {specialist.bio || `Dr. ${specialist.name.split(' ')[0]} is a highly qualified ${specialist.specialty} specialist with extensive experience in providing comprehensive medical care. With a commitment to patient well-being and evidence-based treatment approaches, Dr. ${specialist.name.split(' ')[0]} ensures personalized care for every patient.`}
                                </p>
                            </div>

                            <div className="info-section">
                                <h3>Consultation Timings</h3>
                                <div className="timing-cards">
                                    <div className="timing-card">
                                        <Clock size={24} className="timing-icon" />
                                        <div>
                                            <span className="timing-label">Morning Session</span>
                                            <span className="timing-value">{specialist.morning ? formatTimeRangeTo12h(specialist.morning) : '—'}</span>
                                        </div>
                                    </div>
                                    <div className="timing-card">
                                        <Clock size={24} className="timing-icon" />
                                        <div>
                                            <span className="timing-label">Evening Session</span>
                                            <span className="timing-value">{specialist.evening ? formatTimeRangeTo12h(specialist.evening) : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {specialist.experience && (
                                <div className="info-section">
                                    <h3>Experience</h3>
                                    <p className="experience-text">{specialist.experience}</p>
                                </div>
                            )}

                            {specialist.education && (
                                <div className="info-section">
                                    <h3>Education</h3>
                                    <ul className="education-list">
                                        {Array.isArray(specialist.education) 
                                            ? specialist.education.map((edu, idx) => (
                                                <li key={idx}>
                                                    <CheckCircle2 size={16} />
                                                    <span>{edu}</span>
                                                </li>
                                            ))
                                            : <li><CheckCircle2 size={16} /><span>{specialist.education}</span></li>
                                        }
                                    </ul>
                                </div>
                            )}

                            {specialist.specializations && (
                                <div className="info-section">
                                    <h3>Specializations</h3>
                                    <div className="specializations-grid">
                                        {Array.isArray(specialist.specializations)
                                            ? specialist.specializations.map((spec, idx) => (
                                                <span key={idx} className="specialization-tag">{spec}</span>
                                            ))
                                            : <span className="specialization-tag">{specialist.specializations}</span>
                                        }
                                    </div>
                                </div>
                            )}

                            <div className="info-section">
                                <h3>Contact Information</h3>
                                <div className="contact-info-grid">
                                    {specialist.phone && (
                                        <a href={`tel:${specialist.phone.replace(/\s+/g, '')}`} className="contact-item">
                                            <Phone size={20} />
                                            <span>{specialist.phone}</span>
                                        </a>
                                    )}
                                    {specialist.email && (
                                        <a href={`mailto:${specialist.email}`} className="contact-item">
                                            <Mail size={20} />
                                            <span>{specialist.email}</span>
                                        </a>
                                    )}
                                    {specialist.address && (
                                        <div className="contact-item">
                                            <MapPin size={20} />
                                            <span>{specialist.address}</span>
                                        </div>
                                    )}
                                    {!specialist.phone && !specialist.email && !specialist.address && (
                                        <div className="contact-item">
                                            <span style={{ color: 'var(--gray-600)' }}>Contact information not available</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="action-buttons">
                                <a href="tel:+919894880598" className="btn btn-primary">
                                    <Phone size={20} />
                                    Call to Book
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SpecialistDetail;
