import React from 'react';

// Shape types for the CAPTCHA grid
type ShapeType = "triangle" | "square" | "circle";
type ColorTint = "red" | "green" | "blue";

interface GridSector {
    id: number;
    hasShape: boolean;
    shape: ShapeType;
    tint?: ColorTint;
    rotation?: number;
    jitter?: { x: number; y: number };
}

interface ShapeGridProps {
    className?: string;
    gridData?: GridSector[];
    selectedSectors?: number[];
    onSectorToggle?: (sectorId: number) => void;
}

const ShapeGrid: React.FC<ShapeGridProps> = ({
    className = '',
    gridData = [],
    selectedSectors = [],
    onSectorToggle
}) => {
    // Color mapping for different tints
    const colors = {
        red: '#ef4444',
        green: '#22c55e',
        blue: '#3b82f6'
    };

    const renderShape = (shape: ShapeType, tint?: ColorTint, rotation = 0, jitter = { x: 0, y: 0 }, sectorId = 0) => {
        // Use sector ID as seed for consistent randomness
        const baseSize = 20;
        const seededRandom = (sectorId * 9301 + 49297) % 233280 / 233280; // Simple seeded random
        const variation = seededRandom * 10;
        const size = baseSize + variation;

        const color = colors[tint || 'red'];

        const baseStyle = {
            width: `${size}px`,
            height: `${size}px`,
            transform: `rotate(${rotation}deg) translate(${jitter.x}px, ${jitter.y}px)`,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        };

        if (shape === 'triangle') {
            return (
                <svg style={{ ...baseStyle, fill: color }} viewBox="0 0 24 24">
                    <path d="M12 2 L22 20 L2 20 Z" />
                </svg>
            );
        }

        if (shape === 'square') {
            return (
                <div
                    style={{
                        ...baseStyle,
                        backgroundColor: color,
                        borderRadius: '2px',
                    }}
                />
            );
        }

        if (shape === 'circle') {
            return (
                <div
                    style={{
                        ...baseStyle,
                        backgroundColor: color,
                        borderRadius: '50%',
                    }}
                />
            );
        }

        return null;
    };

    // Add some visual noise to confuse automated systems
    const addVisualNoise = (sectorId: number) => {
        const noiseCount = 5; // Reduced for better visibility
        const noise = [];

        for (let i = 0; i < noiseCount; i++) {
            // Use sector ID and index for consistent positioning
            const seedX = ((sectorId + i) * 9301 + 49297) % 233280 / 233280;
            const seedY = ((sectorId + i + 13) * 9301 + 49297) % 233280 / 233280;

            noise.push(
                <div
                    key={`noise-${i}`}
                    className="absolute w-1 h-1 bg-gray-400 opacity-20"
                    style={{
                        left: `${seedX * 100}%`,
                        top: `${seedY * 100}%`,
                    }}
                />
            );
        }

        return <div className="absolute inset-0 pointer-events-none">{noise}</div>;
    };

    // Show empty grid if no data provided
    if (!gridData || gridData.length === 0) {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            emptyCells.push(
                <div
                    key={`empty-${i}`}
                    className="bg-white border border-gray-300 rounded aspect-square flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                >
                    <span className="text-gray-400">{i + 1}</span>
                </div>
            );
        }

        return (
            <div className={`grid grid-cols-3 gap-2 ${className}`}>
                {emptyCells}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-4 gap-1 ${className}`}>
            {gridData.map((sector) => {
                const isSelected = selectedSectors.includes(sector.id);

                // Handle click events
                const handleSectorClick = () => {
                    if (onSectorToggle) {
                        onSectorToggle(sector.id);
                    }
                };

                return (
                    <div
                        key={sector.id}
                        onClick={handleSectorClick}
                        className={`
                            relative aspect-square border-2 cursor-pointer transition-all duration-200
                            flex items-center justify-center
                            ${isSelected
                                ? 'border-gray-50 bg-gray-500 bg-opacity-20 shadow-lg'
                                : 'border-gray-300 bg-white hover:bg-gray-50'
                            }
                        `}
                        style={{ minHeight: '40px' }}
                    >
                        {addVisualNoise(sector.id)}

                        {sector.hasShape && renderShape(
                            sector.shape,
                            sector.tint,
                            sector.rotation,
                            sector.jitter,
                            sector.id
                        )}

                        {isSelected && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-gray-500 rounded-full border border-white" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ShapeGrid;
