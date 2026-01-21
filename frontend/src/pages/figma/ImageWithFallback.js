import React, { useState } from 'react';

export function ImageWithFallback({ src, alt, fallbackSrc, className }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [errored, setErrored] = useState(false);

    const handleError = () => {
        if (!errored) {
            setErrored(true);
            setImgSrc(fallbackSrc || 'https://via.placeholder.com/150');
        }
    };

    return <img src={imgSrc} alt={alt} onError={handleError} className={className} />;
}
