import React, { useEffect, useState } from 'react';

const ConfettiAnimation = ({ colors = ['#0B5D1E', '#E6B800', '#FFFFFF'] }) => {
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        const pieces = [];
        for (let i = 0; i < 50; i++) {
            pieces.push({
                id: i,
                left: Math.random() * 100,
                animationDelay: Math.random() * 3,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        setConfetti(pieces);
    }, [colors]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confetti.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute w-2 h-2 animate-confetti-fall"
                    style={{
                        left: `${piece.left}%`,
                        top: '-10%',
                        backgroundColor: piece.backgroundColor,
                        animationDelay: `${piece.animationDelay}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default ConfettiAnimation;
