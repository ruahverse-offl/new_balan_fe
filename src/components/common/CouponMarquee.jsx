import React, { useState, useEffect } from 'react';
import { getActiveCoupons } from '../../services/couponsApi';
import { getMarqueeSettings } from '../../services/marqueeApi';
import { mapCouponToFrontend } from '../../utils/dataMapper';
import './CouponMarquee.css';

const CouponMarquee = () => {
    const [activeCoupons, setActiveCoupons] = useState([]);
    const [marqueeSettings, setMarqueeSettings] = useState({ show_marquee: true });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coupons, settings] = await Promise.all([
                    getActiveCoupons(),
                    getMarqueeSettings().catch(() => ({ show_marquee: true }))
                ]);
                setActiveCoupons(coupons.map(mapCouponToFrontend));
                setMarqueeSettings(settings);
            } catch (error) {
                console.error('Error fetching coupon data:', error);
            }
        };
        fetchData();
    }, []);

    if (marqueeSettings.show_marquee === false) return null;
    if (activeCoupons.length === 0) return null;

    // Duplicate coupons exactly 3 times for a seamless -33.33% translation loop
    const displayCoupons = [...activeCoupons, ...activeCoupons, ...activeCoupons];

    return (
        <div className="coupon-marquee-container">
            <div className="marquee-content">
                {displayCoupons.map((coupon, index) => (
                    <div key={`${coupon.id}-${index}`} className="marquee-item">
                        <span className="single-coupon-text">
                            <span className="highlight-code">{coupon.code}</span> — GET {Number(coupon.discount) ?? 0}% OFF YOUR ORDER
                        </span>
                        <span className="coupon-separator">|</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CouponMarquee;
