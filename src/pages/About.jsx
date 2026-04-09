import React from 'react';
import { History, Award, Building2, Heart, TrendingUp, Star, Phone, MessageSquare, Mail } from 'lucide-react';
import LocationSection from '../components/common/LocationSection';
import maniImage from '../assets/images/mani-profile.jpg';
import './About.css';

const ABOUT_CONTACT_METHODS = [
    {
        icon: <Phone size={20} />,
        title: 'Phone',
        desc: 'Call us for immediate assistance',
        value: 'Call Now',
        link: 'tel:+919894880598',
        color: '#3b82f6',
        external: false,
    },
    {
        icon: <MessageSquare size={20} />,
        title: 'WhatsApp',
        desc: 'Chat with us on WhatsApp',
        value: 'Chat Now',
        link: 'https://wa.me/9894880598',
        color: '#25D366',
        external: true,
    },
    {
        icon: <Mail size={20} />,
        title: 'Email',
        desc: 'Write to us for enquiries',
        value: 'Email us',
        link: 'mailto:newbalanmedicals@gmail.com',
        color: '#6366f1',
        external: false,
    },
];

const About = () => {
    const milestones = [
        {
            year: "1997",
            title: "Medical Shop Established",
            desc: "Inception of NEW BALAN Medical with a vision to serve the community with genuine pharmaceutical care.",
            icon: <Building2 size={24} />
        },
        {
            year: "2022",
            title: "Introduced Star Health",
            desc: "Expanded services into health insurance, partnering with Star Health to provide financial security to families.",
            icon: <Heart size={24} />
        },
        {
            year: "2023",
            title: "Zonal Manager Club",
            desc: "Achieved the prestigious Zonal Manager Club status within the very first year of operations.",
            icon: <Award size={24} />
        },
        {
            year: "2024",
            title: "Branch Manager - Zonal Manager Club",
            desc: "Achieved a key milestone by becoming a Branch Manager and earning recognition in the Zonal Manager Club for outstanding performance and leadership.",
            icon: <TrendingUp size={24} />
        }
    ];

    const achievements = [
        { icon: <History size={28} />, value: "29+", label: "Years Experience", color: "#3b82f6" },
        { icon: <Award size={28} />, value: "2022-2024", label: "Zonal Manager Club", color: "#28a745" },
        { icon: <Star size={28} />, value: "1997", label: "Established Since", color: "#f59e0b" },
        { icon: <Heart size={28} />, value: "1000+", label: "Happy Families", color: "#e11d48" }
    ];

    return (
        <div className="about-page animate-fade">
            <header className="page-header about-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>About Us</h1>
                    <p>Discover the story behind NEW BALAN's legacy of trust and care.</p>
                </div>
            </header>

            {/* Founder Profile Section */}
            <section className="section founder-section">
                <div className="container">
                    <div className="founder-card">
                        <div className="founder-image-wrapper">
                            <div className="founder-image-frame">
                                <img src={maniImage} alt="Manikandan - Founder" />
                                <div className="image-badge">
                                    <Award size={20} />
                                    <span>Founder & Director</span>
                                </div>
                            </div>
                        </div>
                        <div className="founder-content">
                            <div className="founder-badge">
                                <span>The Visionary</span>
                            </div>
                            <h2>MANIKANDAN</h2>
                            <p className="founder-role">Founder & Director</p>
                            <p className="founder-description">
                                With over 29 years of experience in the pharmaceutical industry, Mani founded NEW BALAN with a single mission: to make healthcare accessible and reliable for everyone in our community.
                            </p>
                            <div className="achievements-grid">
                                {achievements.map((achievement, idx) => (
                                    <div key={idx} className="achievement-item">
                                        <div className="achievement-icon" style={{ background: `${achievement.color}15`, color: achievement.color }}>
                                            {achievement.icon}
                                        </div>
                                        <div className="achievement-content">
                                            <strong>{achievement.value}</strong>
                                            <span>{achievement.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="section timeline-section">
                <div className="container">
                    <div className="section-header-compact">
                        <h2>Our Journey</h2>
                        <p>Key milestones from a local shop to a comprehensive healthcare hub.</p>
                    </div>
                    <div className="timeline-grid">
                        {milestones.map((milestone, idx) => (
                            <div key={idx} className="milestone-card">
                                <div className="milestone-year">{milestone.year}</div>
                                <div className="milestone-icon-wrapper">
                                    {milestone.icon}
                                </div>
                                <h3>{milestone.title}</h3>
                                <p>{milestone.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="section mission-section">
                <div className="container">
                    <div className="mission-card">
                        <div className="mission-content">
                            <h2>Our Mission</h2>
                            <p>To provide accessible, reliable, and quality healthcare services to our community, ensuring that every family receives the care and support they deserve.</p>
                        </div>
                        <div className="mission-content">
                            <h2>Our Vision</h2>
                            <p>To be the most trusted healthcare partner in our community, combining traditional care values with modern medical services and insurance solutions.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section contact-methods-section about-contact-methods" aria-labelledby="about-contact-methods-heading">
                <div className="container">
                    <div className="section-header-compact">
                        <h2 id="about-contact-methods-heading">Get in Touch</h2>
                        <p>Reach us by phone, WhatsApp, or email — same details as on our Contact page.</p>
                    </div>
                    <div className="contact-methods-grid">
                        {ABOUT_CONTACT_METHODS.map((method, idx) => (
                            <div key={idx} className="contact-method-card">
                                <div
                                    className="method-icon-wrapper"
                                    style={{ background: `${method.color}15`, color: method.color }}
                                >
                                    {method.icon}
                                </div>
                                <h3>{method.title}</h3>
                                <p className="method-desc">{method.desc}</p>
                                <a
                                    href={method.link}
                                    target={method.external ? '_blank' : undefined}
                                    rel={method.external ? 'noopener noreferrer' : undefined}
                                    className={`method-button ${method.title.toLowerCase().replace(/\s+/g, '-')}`}
                                    style={{
                                        backgroundColor: method.color,
                                        color: '#fff',
                                    }}
                                >
                                    {method.icon}
                                    <span>{method.value}</span>
                                </a>
                                {method.title === 'Email' && (
                                    <p className="contact-method-inline-detail">newbalanmedicals@gmail.com</p>
                                )}
                                {method.title === 'Phone' && (
                                    <p className="contact-method-inline-detail">+91 9894880598</p>
                                )}
                                {method.title === 'WhatsApp' && (
                                    <p className="contact-method-inline-detail">+91 9894880598</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <LocationSection />
        </div>
    );
};

export default About;
