import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShieldCheck, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDeliverySettings, getDeliverySlots } from '../../services/deliveryApi';
import './Hero.css';
import heroImg from '../../assets/images/hero-banner.png';

const DEFAULT_DELIVERY_LABEL = '9 am to 9 pm · Pharmacy';

const Hero = () => {
    const { isAuthenticated } = useAuth();
    const [deliveryLabel, setDeliveryLabel] = useState(DEFAULT_DELIVERY_LABEL);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const settings = await getDeliverySettings();
                if (cancelled) return;
                // Backend returns 404 when no delivery settings exist → frontend returns object without id; then we keep default
                if (!settings?.id) return;
                const res = await getDeliverySlots({
                    delivery_settings_id: settings.id,
                    is_active: true,
                    limit: 20,
                    sort_by: 'slot_order',
                    sort_order: 'asc',
                });
                if (cancelled) return;
                const items = res?.items ?? [];
                const timings = items
                    .filter((s) => s && s.slot_time)
                    .map((s) => s.slot_time)
                    .join(', ');
                if (timings) setDeliveryLabel(`Delivery: ${timings}`);
            } catch {
                // keep default on error (e.g. network, backend down)
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
