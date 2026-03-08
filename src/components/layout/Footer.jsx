import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import logo from '../../assets/new_balan_logo.png';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                <div className="footer-brand">
                    <Link to="/" className="logo">
                        <img src={logo} alt="New Balan Medical" className="footer-logo-img" />
                        <div className="logo-text">
                            <span className="logo-main">NEW BALAN</span>
                            <span className="logo-sub">Medical & Clinic</span>
                        </div>
                    </Link>
                    <p className="brand-tagline">
                        Trusted healthcare since 1997. Providing quality medical services and insurance solutions to our community.
                    </p>
                    <div className="whatsapp-cta">
                        <a href="https://wa.me/9894880598" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                            <MessageSquare size={20} />
                            <span>Chat on WhatsApp</span>
                        </a>
                    </div>
                </div>

                <div className="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><Link to="/clinic">Clinic Services</Link></li>
                        <li><Link to="/polyclinic">Polyclinic Tests</Link></li>
                        <li><Link to="/pharmacy">Pharmacy Shop</Link></li>
                        <li><Link to="/insurance">Star Health Insurance</Link></li>
                        <li><Link to="/about">About Founder</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                    </ul>
                </div>

                <div className="footer-timing">
                    <h3>Store Timings</h3>
                    <div className="timing-item">
                        <Clock size={18} className="timing-icon" />
                        <div>
                            <p>Mon - Sat: 9:00 AM - 11:00 PM</p>
                            <p>Sunday: 10:00 AM - 11:00 PM</p>
                        </div>
                    </div>
                    <div className="order-limit-info">
                        <p>Note: Medicine orders are accepted 9:00 AM - 9:00 PM only.</p>
                    </div>
                </div>

                <div className="footer-contact">
                    <h3>Contact Us</h3>
                    <div className="contact-item">
                        <Phone size={18} className="contact-icon" />
                        <span>+91 9894880598</span>
                    </div>
                    <div className="contact-item">
                        <Mail size={18} className="contact-icon" />
                        <span>newbalanmedicals@gmail.com</span>
                    </div>
                    <div className="contact-item">
                        <MapPin size={18} className="contact-icon" />
                        <span>120/a Poobalarayapuram 2nd street,<br />
                            Thoothukudi, Tamil Nadu 628001</span>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-legal-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <span className="separator">|</span>
                        <Link to="/terms">Terms & Conditions</Link>
                    </div>
                    <p>&copy; {new Date().getFullYear()} NEW BALAN Medical Shop & Clinic. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
