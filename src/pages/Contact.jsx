import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Navigation } from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const contactMethods = [
        {
            icon: <Phone size={20} />,
            title: "Phone",
            desc: "Call us for immediate assistance",
            value: "Call Now",
            link: "tel:+919894880598",
            color: "#3b82f6"
        },
        {
            icon: <MessageSquare size={20} />,
            title: "WhatsApp",
            desc: "Chat with us on WhatsApp",
            value: "Chat Now",
            link: "https://wa.me/9894880598",
            color: "#25D366",
            external: true
        },
        {
            icon: <Clock size={24} />,
            title: "Store Timings",
            desc: "We're open for you",
            value: "Morning & Evening Sessions",
            link: null,
            color: "#f59e0b",
            details: [
                "Morning: 10:00 AM - 1:30 PM",
                "Evening: 6:30 PM - 9:30 PM"
            ]
        }
    ];

    return (
        <div className="contact-page animate-fade">
            <header className="page-header contact-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Contact Us</h1>
                    <p>Get in touch with us. We're here to help you with all your healthcare needs.</p>
                </div>
            </header>

            {/* Contact Methods Section */}
            <section className="section contact-methods-section">
                <div className="container">
                    <div className="section-header-compact">
                        <h2>Get in Touch</h2>
                        <p>Reach out to us through any of these channels. We're available to assist you.</p>
                    </div>
                    <div className="contact-methods-grid">
                        {contactMethods.map((method, idx) => (
                            <div key={idx} className="contact-method-card">
                                <div className="method-icon-wrapper" style={{ background: `${method.color}15`, color: method.color }}>
                                    {method.icon}
                                </div>
                                <h3>{method.title}</h3>
                                <p className="method-desc">{method.desc}</p>
                                {method.link ? (
                                    <a 
                                        href={method.link} 
                                        target={method.external ? "_blank" : undefined}
                                        rel={method.external ? "noopener noreferrer" : undefined}
                                        className={`method-button ${method.title.toLowerCase().replace(/\s+/g, '-')}`}
                                        style={{ 
                                            backgroundColor: method.color,
                                            color: '#fff'
                                        }}
                                    >
                                        {method.icon}
                                        <span>{method.value}</span>
                                    </a>
                                ) : (
                                    <div className="method-value">{method.value}</div>
                                )}
                                {method.details && (
                                    <div className="method-details">
                                        {method.details.map((detail, i) => (
                                            <p key={i}>{detail}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Location & Map Section */}
            <section className="section location-map-section">
                <div className="container">
                    <div className="location-map-grid">
                        <div className="location-info-card">
                            <div className="location-header">
                                <div className="location-icon-wrapper">
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <h2>Visit Us</h2>
                                    <p>Come visit our clinic and pharmacy</p>
                                </div>
                            </div>
                            <address className="location-address">
                                120/a Poobalarayapuram 2nd street,<br />
                                Thoothukudi, Tamil Nadu 628001
                            </address>
                            <a
                                href="https://maps.app.goo.gl/pvMjw454bA21VuQu9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary directions-btn"
                            >
                                <Navigation size={18} />
                                Get Directions
                            </a>
                        </div>
                        <div className="map-wrapper map-wrapper-embed">
                            <iframe
                                src="/location-map.html"
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: '16px' }}
                                loading="lazy"
                                title="New Balan Medicals - Thoothukudi"
                            />
                            <a
                                href="https://maps.app.goo.gl/pvMjw454bA21VuQu9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-wrapper-open-link"
                            >
                                <Navigation size={18} />
                                Open in Google Maps
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
