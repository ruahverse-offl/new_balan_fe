import React from 'react';
import { History, Award, Building2, Heart, TrendingUp, Star } from 'lucide-react';
import LocationSection from '../components/common/LocationSection';
import maniImage from '../assets/images/mani-profile.jpg';
import './About.css';

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

            <LocationSection />
        </div>
    );
};

export default About;
