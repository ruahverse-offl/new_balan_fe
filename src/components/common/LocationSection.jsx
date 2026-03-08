import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import './LocationSection.css';

const LocationSection = () => {
    return (
        <section className="section location-section bg-light">
            <div className="container">
                <div className="section-header">
                    <span className="badge badge-blue">Our Clinic</span>
                    <h2>Visit Us Today</h2>
                </div>

                <div className="location-grid">
                    <div className="location-content">
                        <div className="location-icon-wrapper">
                            <MapPin size={32} />
                        </div>

                        <h3>New Balan medicals</h3>

                        <p className="location-address">
                            120/a Poobalarayapuram 2nd street,<br />
                            Thoothukudi, Tamil Nadu 628001
                        </p>

                        <a
                            href="https://maps.app.goo.gl/pvMjw454bA21VuQu9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            <Navigation size={18} />
                            Get Directions
                        </a>
                    </div>

                    <div className="location-map">
                        <iframe
                            src="/location-map.html"
                            width="100%"
                            height="400"
                            style={{ border: 0, borderRadius: '16px', minHeight: '300px' }}
                            loading="lazy"
                            title="New Balan Medicals - Thoothukudi"
                        />
                        <a
                            href="https://maps.app.goo.gl/pvMjw454bA21VuQu9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-map-fallback"
                        >
                            <Navigation size={18} />
                            Open in Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationSection;
