import React, { useState } from 'react';
import { ShieldPlus, CheckCircle, MessageSquare, Phone, HelpCircle, UserCheck, Activity, Users, Heart, AlertCircle, User, Award, Star, Clock, Send } from 'lucide-react';
import { InlineSpinner } from '../components/common/PageLoading';
import LocationSection from '../components/common/LocationSection';
import './Insurance.css';

const Insurance = () => {
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        customer_age: '',
        family_size: '',
        plan_type: '',
        message: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitEnquiry = async (e) => {
        e.preventDefault();
        if (!formData.customer_name.trim() || !formData.customer_phone.trim()) return;

        setSubmitting(true);
        setSubmitResult(null);
        try {
            await new Promise((r) => setTimeout(r, 300));
            setSubmitResult({
                type: 'success',
                message:
                    'Please call or WhatsApp us with your details to complete your insurance enquiry — we no longer store enquiries through this form.',
            });
            setFormData({ customer_name: '', customer_phone: '', customer_age: '', family_size: '', plan_type: '', message: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const benefits = [
        "Cashless hospitalization in 14000+ network hospitals.",
        "No pre-acceptance medical screening up to 50 years.",
        "Coverage for pre-existing diseases after 48 months.",
        "Direct in-house claim settlement (No TPA).",
        "Lifetime renewal facility.",
        "Tax benefits under Section 80D."
    ];

    return (
        <div className="insurance-page animate-fade">
            <header className="page-header insurance-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Star Health & Allied Insurance</h1>
                    <p>Securing your family's future with India's first standalone health insurance provider.</p>
                </div>
            </header>
            <section className="section consultation-box">
                <div className="container">
                    <div className="consultation-card">
                        <div className="consultation-content">
                            <div className="consultation-header">
                                <div className="consultation-icon-wrapper">
                                    <UserCheck size={32} />
                                </div>
                                <div>
                                    <h2>Consult with Manikandan</h2>
                                    <div className="achievement-badge-inline">
                                        <Award size={16} />
                                        <span>Zonal Manager Club Achiever</span>
                                    </div>
                                </div>
                            </div>
                            <div className="consultation-timings">
                                <div className="timing-item-compact">
                                    <Clock size={18} />
                                    <div>
                                        <strong>In-Person:</strong>
                                        <span>1:00 PM – 2:00 PM (Daily)</span>
                                    </div>
                                </div>
                                <div className="timing-item-compact">
                                    <Phone size={18} />
                                    <div>
                                        <strong>Phone / WhatsApp:</strong>
                                        <span>Anytime</span>
                                    </div>
                                </div>
                            </div>
                            <div className="consultation-actions">
                                <a href="https://wa.me/9894880598" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                    <MessageSquare size={18} />
                                    <span>WhatsApp</span>
                                </a>
                                <a href="tel:+919894880598" className="btn btn-primary">
                                    <Phone size={18} />
                                    <span>Call Now</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="section insurance-content-section">
                <div className="container">
                    {/* About & What It Does */}
                    <div className="info-cards-grid">
                        <div className="info-card">
                            <div className="info-card-icon">
                                <ShieldPlus size={28} />
                            </div>
                            <h3>About Star Health</h3>
                            <p>Star Health & Allied Insurance Co. Ltd. is India's first standalone health insurance company, established in 2006.</p>
                            <ul className="info-list">
                                <li><CheckCircle size={16} /> Started in 2006</li>
                                <li><CheckCircle size={16} /> Head office in Chennai, Tamil Nadu</li>
                                <li><CheckCircle size={16} /> Trusted by lakhs across India</li>
                            </ul>
                        </div>

                        <div className="info-card">
                            <div className="info-card-icon">
                                <Activity size={28} />
                            </div>
                            <h3>What This Insurance Does</h3>
                            <p>Comprehensive health coverage that helps you during medical emergencies and planned treatments.</p>
                            <ul className="info-list">
                                <li><CheckCircle size={16} /> Pays hospital bills</li>
                                <li><CheckCircle size={16} /> Covers sickness & accidents</li>
                                <li><CheckCircle size={16} /> Financial protection for families</li>
                            </ul>
                        </div>
                    </div>

                    {/* Key Benefits */}
                    <div className="benefits-section-compact">
                        <div className="section-header-compact">
                            <Star size={24} className="header-icon" />
                            <h2>Key Benefits</h2>
                        </div>
                        <div className="benefits-grid-compact">
                            {benefits.map((benefit, idx) => (
                                <div key={idx} className="benefit-item-compact">
                                    <CheckCircle size={20} className="benefit-check" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insurance Plans */}
                    <div className="plans-section-compact">
                        <div className="section-header-compact">
                            <ShieldPlus size={24} className="header-icon" />
                            <h2>Insurance Plans Available</h2>
                        </div>
                        <div className="plans-grid-compact">
                            <div className="plan-item-compact">
                                <div className="plan-icon-wrapper">
                                    <User size={24} />
                                </div>
                                <h4>Individual Plan</h4>
                                <p>Coverage for one person</p>
                            </div>
                            <div className="plan-item-compact">
                                <div className="plan-icon-wrapper">
                                    <Users size={24} />
                                </div>
                                <h4>Family Plan</h4>
                                <p>Coverage for entire family</p>
                            </div>
                            <div className="plan-item-compact">
                                <div className="plan-icon-wrapper">
                                    <Heart size={24} />
                                </div>
                                <h4>Senior Citizen</h4>
                                <p>Special plans for elders</p>
                            </div>
                            <div className="plan-item-compact">
                                <div className="plan-icon-wrapper">
                                    <AlertCircle size={24} />
                                </div>
                                <h4>Critical Illness</h4>
                                <p>Coverage for serious diseases</p>
                            </div>
                        </div>
                    </div>

                    {/* Why Choose & How We Help */}
                    <div className="help-section-grid">
                        <div className="help-card">
                            <h3>Why Choose Star Health</h3>
                            <ul className="help-list">
                                <li><CheckCircle size={18} /> Large network of 14,000+ hospitals</li>
                                <li><CheckCircle size={18} /> Flexible plans for all ages</li>
                                <li><CheckCircle size={18} /> Fast cashless claim processing</li>
                                <li><CheckCircle size={18} /> Covers pre & post hospitalization</li>
                                <li><CheckCircle size={18} /> No medical test for under 50 years</li>
                            </ul>
                        </div>
                        <div className="help-card">
                            <h3>How We Help You</h3>
                            <p className="help-intro">New Balan Medical Shop provides complete guidance:</p>
                            <ul className="help-list">
                                <li><CheckCircle size={18} /> Choose the right plan for your budget</li>
                                <li><CheckCircle size={18} /> Understand insurance terms easily</li>
                                <li><CheckCircle size={18} /> Personal assistance during claims</li>
                            </ul>
                            <a href="/contact" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                Visit Us for Help
                            </a>
                        </div>
                    </div>

                    {/* Insurance Enquiry Form */}
                    <div className="enquiry-form-section">
                        <div className="section-header-compact">
                            <Send size={24} className="header-icon" />
                            <h2>Submit an Enquiry</h2>
                        </div>
                        <p className="enquiry-subtitle">Interested in health insurance? Fill in your details and our expert Manikandan will get back to you.</p>

                        {submitResult && (
                            <div className={`enquiry-alert ${submitResult.type === 'success' ? 'enquiry-alert-success' : 'enquiry-alert-error'}`}>
                                {submitResult.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span>{submitResult.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitEnquiry} className="enquiry-form">
                            <div className="enquiry-form-grid">
                                <div className="enquiry-field">
                                    <label htmlFor="customer_name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="customer_name"
                                        name="customer_name"
                                        value={formData.customer_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter your name"
                                        required
                                        maxLength={255}
                                    />
                                </div>
                                <div className="enquiry-field">
                                    <label htmlFor="customer_phone">Phone Number *</label>
                                    <input
                                        type="tel"
                                        id="customer_phone"
                                        name="customer_phone"
                                        value={formData.customer_phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter your phone number"
                                        required
                                        maxLength={15}
                                    />
                                </div>
                                <div className="enquiry-field">
                                    <label htmlFor="customer_age">Age</label>
                                    <input
                                        type="number"
                                        id="customer_age"
                                        name="customer_age"
                                        value={formData.customer_age}
                                        onChange={handleInputChange}
                                        placeholder="Your age"
                                        min={0}
                                        max={150}
                                    />
                                </div>
                                <div className="enquiry-field">
                                    <label htmlFor="family_size">Family Size</label>
                                    <input
                                        type="number"
                                        id="family_size"
                                        name="family_size"
                                        value={formData.family_size}
                                        onChange={handleInputChange}
                                        placeholder="No. of members"
                                        min={1}
                                        max={20}
                                    />
                                </div>
                                <div className="enquiry-field enquiry-field-full">
                                    <label htmlFor="plan_type">Preferred Plan</label>
                                    <select
                                        id="plan_type"
                                        name="plan_type"
                                        value={formData.plan_type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select a plan (optional)</option>
                                        <option value="Individual Plan">Individual Plan</option>
                                        <option value="Family Plan">Family Plan</option>
                                        <option value="Senior Citizen">Senior Citizen Plan</option>
                                        <option value="Critical Illness">Critical Illness Plan</option>
                                    </select>
                                </div>
                                <div className="enquiry-field enquiry-field-full">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Any specific requirements or questions..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary enquiry-submit-btn" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <InlineSpinner size={18} className="spin-icon" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Submit Enquiry</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* FAQ Section */}
                    <div className="faq-section-compact">
                        <div className="section-header-compact">
                            <HelpCircle size={24} className="header-icon" />
                            <h2>Frequently Asked Questions</h2>
                        </div>
                        <div className="faq-grid-compact">
                            <div className="faq-item-compact">
                                <h4>What is the waiting period for pre-existing diseases?</h4>
                                <p>Typically 48 months of continuous coverage is required for PED coverage in most plans.</p>
                            </div>
                            <div className="faq-item-compact">
                                <h4>How do I file a cashless claim?</h4>
                                <p>Present your Star Health ID card at any network hospital. Our team can assist with the paperwork.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <LocationSection />
        </div>
    );
};

export default Insurance;
