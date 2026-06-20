import React, { useState, useEffect } from 'react';

/**
 * Avatar — shows an image, and gracefully falls back to a coloured initial
 * if the src is missing OR the image fails to load (broken/slow URL).
 */
const Avatar = ({ src, name, size = 48, className = '' }) => {
    const [failed, setFailed] = useState(false);
    useEffect(() => { setFailed(false); }, [src]); // reset when the src changes

    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const dim = { width: size, height: size };

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name || 'avatar'}
                style={dim}
                className={`rounded-full object-cover border border-gray-200 shadow-sm bg-gray-100 flex-shrink-0 ${className}`}
                onError={() => setFailed(true)}
                loading="lazy"
            />
        );
    }
    return (
        <div
            style={dim}
            className={`rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black border border-brand-200 flex-shrink-0 ${className}`}
        >
            <span style={{ fontSize: size * 0.42 }}>{initial}</span>
        </div>
    );
};

export default Avatar;
