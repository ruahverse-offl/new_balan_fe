import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero';
import LocationSection from '../components/common/LocationSection';
import { Baby, Eye, Activity, Truck, FileText, Shield, CheckCircle, Clock, Award, Heart } from 'lucide-react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            <Hero />

            {/* Clinic Specialties Section */}
            <section className="section clinic-specialties">
                <div className="container">
                    <div className="section-header">
                        <span className="badge badge-blue">Our Clinic</span>
                        <h2>Expert Consultations</h2>
                        <p>Quality diagnostic and treatment services by experienced specialists.</p>
                    </div>

                    <div className="specialty-grid">
                        <div className="specialty-card">
                            <div className="card-icon"><Baby size={32} /></div>
                            <h3>Paediatrics</h3>
                            <p>Specialized healthcare for infants, children, and adolescents.</p>
                        </div>
                        <div className="specialty-card">
                            <div className="card-icon"><Activity size={32} /></div>
                            <h3>Diabetology</h3>
                            <p>Expert management and screening for diabetes and related conditions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pharmacy Highlights */}
            <section className="section pharmacy-highlights bg-light">
                <div className="container">
                    <div className="highlights-content-full">
                        <span className="badge badge-green">24/7 Support</span>
                        <h2>Your Trusted Pharmacy Partner Since 1997</h2>
                        <p>
                            We provide a wide range of genuine medicines with professional guidance.
                            Our pharmacy is equipped to handle both OTC and Narcotic prescriptions with strict adherence to safety standards.
                        </p>

                        <div className="highlight-list">
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <Truck className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>Fast Delivery</h4>
                                    <p>Get your medicines delivered to your doorstep within hours.</p>
                                </div>
                            </div>
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <FileText className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>Prescription Care</h4>
                                    <p>Easy upload for narcotic medicines and expert validation.</p>
                                </div>
                            </div>
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <CheckCircle className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>Genuine Medicines</h4>
                                    <p>100% authentic pharmaceutical products with quality assurance.</p>
                                </div>
                            </div>
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <Clock className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>24/7 Support</h4>
                                    <p>Round-the-clock assistance for all your healthcare needs.</p>
                                </div>
                            </div>
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <Award className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>Expert Guidance</h4>
                                    <p>Professional advice from licensed pharmacists and doctors.</p>
                                </div>
                            </div>
                            <div className="h-item">
                                <div className="h-icon-wrapper">
                                    <Heart className="h-icon" size={24} />
                                </div>
                                <div>
                                    <h4>Trusted Since 1997</h4>
                                    <p>Over 25 years of dedicated service to the community.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Star Health Quick Info */}
            <section className="section star-health-quick">
                <div className="container star-card">
                    <div className="star-content">
                        <Shield size={48} className="star-logo-icon" />
                        <div className="star-text">
                            <h3 style={{ color: '#fff' }}>Star Health Insurance Partner</h3>
                            <p>Secure your family's future with Mani - Zonal Manager Club Achiever. Plan consultations available daily.</p>
                        </div>
                    </div>
                    <Link to="/insurance" className="btn btn-outline">Check Plans</Link>
                </div>
            </section>

            {/* Location Section */}
            <LocationSection />
        </div>
    );
};

export default Home;
