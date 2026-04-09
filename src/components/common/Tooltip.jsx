import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import './Tooltip.css';

const Tooltip = ({ text, children, position = 'top', icon = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    if (icon) {
        return (
            <div className="tooltip-wrapper">
                <div
                    className="tooltip-icon"
                    onMouseEnter={() => setIsVisible(true)}
                    onMouseLeave={() => setIsVisible(false)}
                    onFocus={() => setIsVisible(true)}
                    onBlur={() => setIsVisible(false)}
                    tabIndex={0}
                    aria-label={text}
                >
                    <HelpCircle size={16} />
                </div>
                {isVisible && (
                    <div className={`tooltip tooltip-${position}`} role="tooltip">
                        {text}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="tooltip-wrapper">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                tabIndex={0}
            >
                {children}
            </div>
            {isVisible && (
                <div className={`tooltip tooltip-${position}`} role="tooltip">
                    {text}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
