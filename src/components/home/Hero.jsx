import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShieldCheck, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDeliverySettings } from '../../services/deliveryApi';
import './Hero.css';
import heroImg from '../../assets/images/hero-banner.png';

const DEFAULT_DELIVERY_LABEL = 'Home delivery · Free delivery on qualifying orders';

const Hero = () => {
    const { isAuthenticated } = useAuth();
    const [deliveryLabel, setDeliveryLabel] = useState(DEFAULT_DELIVERY_LABEL);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const settings = await getDeliverySettings();
                if (cancelled || !settings) return;
                const min = settings.free_delivery_min_amount ?? settings.free_delivery_threshold;
                const max = settings.free_delivery_max_amount;
                if (min == null || min === '') return;
                const minN = Number(min);
                if (Number.isNaN(minN)) return;
                let text = `Free delivery for orders ₹${minN.toFixed(0)}`;
                if (max != null && max !== '' && Number(max) > 0) {
                    text += ` – ₹${Number(max).toFixed(0)}`;
                } else {
                    text += '+';
                }
                setDeliveryLabel(text);
            } catch {
                // keep default on error
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <img src={heroImg} alt="New Balan Healthcare" className="hero-bg" />

            <div className="container hero-container">
                <div className="hero-content">
                    <span className="hero-badge">Trusted Since 1997</span>
                    <h1>Comprehensive Healthcare Solutions for Your Family</h1>
                    <p>
                        Experience premium medical care at NEW BALAN. From multi-specialty clinic consultations
                        to doorstep pharmacy delivery and expert insurance guidance.
                    </p>

                    <div className="hero-ctas">
                        {isAuthenticated ? (
                            <Link to="/pharmacy" className="btn btn-secondary">
                                <Pill size={20} />
                                <span>Order Medicines</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-secondary">
                                <LogIn size={20} />
                                <span>Login to Get Started</span>
                            </Link>
                        )}
                    </div>

                    <div className="hero-features">
                        <div className="h-feature">
                            <ShieldCheck className="feature-icon" />
                            <span>Star Health Partner</span>
                        </div>
                        <div className="h-feature">
                            <ChevronRight className="feature-icon" />
                            <span>{deliveryLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
