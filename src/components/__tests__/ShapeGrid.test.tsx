import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShapeGrid from '../ShapeGrid';

describe('ShapeGrid Component', () => {
    const testData = [
        { id: 1, hasShape: true, shape: 'triangle' as const, tint: 'red' as const },
        { id: 2, hasShape: true, shape: 'square' as const, tint: 'green' as const },
        { id: 3, hasShape: true, shape: 'circle' as const, tint: 'blue' as const },
        { id: 4, hasShape: false, shape: 'triangle' as const }
    ];

    // Basic rendering tests
    it('shows empty grid with numbers 1-9 when no data provided', () => {
        render(<ShapeGrid />);

        for (let i = 1; i <= 9; i++) {
            expect(screen.getByText(i.toString())).toBeInTheDocument();
        }
    });

    it('renders sectors when grid data is provided', () => {
        render(<ShapeGrid gridData={testData} />);

        const sectors = document.querySelectorAll('.cursor-pointer');
        expect(sectors).toHaveLength(4);
    });

    it('applies custom CSS classes', () => {
        render(<ShapeGrid className="my-custom-class" />);

        const grid = screen.getByText('1').parentElement?.parentElement;
        expect(grid).toHaveClass('my-custom-class');
    });

    // Shape rendering tests
    describe('Shape Rendering', () => {
        it('renders triangle as SVG', () => {
            const triangleData = [{ id: 1, hasShape: true, shape: 'triangle' as const }];
            render(<ShapeGrid gridData={triangleData} />);

            expect(document.querySelector('svg')).toBeInTheDocument();
            expect(document.querySelector('path')).toHaveAttribute('d', 'M12 2 L22 20 L2 20 Z');
        });

        it('renders square as div with 2px border radius', () => {
            const squareData = [{ id: 1, hasShape: true, shape: 'square' as const }];
            render(<ShapeGrid gridData={squareData} />);

            const square = document.querySelector('div[style*="border-radius: 2px"]');
            expect(square).toBeInTheDocument();
        });

        it('renders circle as div with 50% border radius', () => {
            const circleData = [{ id: 1, hasShape: true, shape: 'circle' as const }];
            render(<ShapeGrid gridData={circleData} />);

            const circle = document.querySelector('div[style*="border-radius: 50%"]');
            expect(circle).toBeInTheDocument();
        });

        it('does not render shapes when hasShape is false', () => {
            const noShapeData = [{ id: 1, hasShape: false, shape: 'triangle' as const }];
            render(<ShapeGrid gridData={noShapeData} />);

            expect(document.querySelector('svg')).not.toBeInTheDocument();
            expect(document.querySelector('div[style*="background-color"]')).not.toBeInTheDocument();
        });
    });

    // Color tests
    describe('Colors', () => {
        it('applies correct colors for each tint', () => {
            const colorData = [
                { id: 1, hasShape: true, shape: 'square' as const, tint: 'red' as const },
                { id: 2, hasShape: true, shape: 'square' as const, tint: 'green' as const },
                { id: 3, hasShape: true, shape: 'square' as const, tint: 'blue' as const }
            ];

            render(<ShapeGrid gridData={colorData} />);

            const shapes = document.querySelectorAll('div[style*="background-color"]');
            expect(shapes[0]).toHaveStyle('background-color: rgb(239, 68, 68)'); // red
            expect(shapes[1]).toHaveStyle('background-color: rgb(34, 197, 94)'); // green
            expect(shapes[2]).toHaveStyle('background-color: rgb(59, 130, 246)'); // blue
        });

        it('defaults to red when no tint specified', () => {
            const data = [{ id: 1, hasShape: true, shape: 'square' as const }];
            render(<ShapeGrid gridData={data} />);

            const shape = document.querySelector('div[style*="background-color"]');
            expect(shape).toHaveStyle('background-color: rgb(239, 68, 68)');
        });
    });

    // Selection and interaction tests
    describe('User Interactions', () => {
        it('shows selected sectors differently', () => {
            render(<ShapeGrid gridData={testData} selectedSectors={[1, 3]} />);

            const selectedSectors = document.querySelectorAll('.border-gray-50.bg-gray-500');
            expect(selectedSectors.length).toBeGreaterThanOrEqual(2);
        });

        it('calls callback when sector is clicked', () => {
            const handleClick = vi.fn();
            render(<ShapeGrid gridData={testData} onSectorToggle={handleClick} />);

            const firstSector = document.querySelector('.cursor-pointer')!;
            fireEvent.click(firstSector);

            expect(handleClick).toHaveBeenCalledWith(1);
        });

        it('handles clicks on multiple sectors', () => {
            const handleClick = vi.fn();
            render(<ShapeGrid gridData={testData} onSectorToggle={handleClick} />);

            const sectors = document.querySelectorAll('.cursor-pointer');
            fireEvent.click(sectors[0]);
            fireEvent.click(sectors[1]);

            expect(handleClick).toHaveBeenCalledTimes(2);
            expect(handleClick).toHaveBeenNthCalledWith(1, 1);
            expect(handleClick).toHaveBeenNthCalledWith(2, 2);
        });

        it('does not crash when no click handler provided', () => {
            render(<ShapeGrid gridData={testData} />);

            const sector = document.querySelector('.cursor-pointer')!;
            expect(() => fireEvent.click(sector)).not.toThrow();
        });
    });

    // Visual noise (anti-bot feature)
    describe('Anti-Bot Features', () => {
        it('adds visual noise to confuse bots', () => {
            render(<ShapeGrid gridData={testData} />);

            const noiseElements = document.querySelectorAll('.bg-gray-400.opacity-20');
            expect(noiseElements.length).toBe(testData.length * 5); // 5 noise dots per sector
        });

        it('generates consistent noise (same input = same output)', () => {
            const singleSector = [testData[0]];

            const { unmount } = render(<ShapeGrid gridData={singleSector} />);
            const firstNoise = Array.from(document.querySelectorAll('.bg-gray-400.opacity-20'))
                .map(el => (el as HTMLElement).style.cssText);

            unmount();
            render(<ShapeGrid gridData={singleSector} />);
            const secondNoise = Array.from(document.querySelectorAll('.bg-gray-400.opacity-20'))
                .map(el => (el as HTMLElement).style.cssText);

            expect(firstNoise).toEqual(secondNoise);
        });
    });

    // Transformation tests
    describe('Shape Transformations', () => {
        it('applies rotation and position jitter', () => {
            const transformData = [{
                id: 1,
                hasShape: true,
                shape: 'square' as const,
                rotation: 45,
                jitter: { x: 10, y: 15 }
            }];

            render(<ShapeGrid gridData={transformData} />);

            const shape = document.querySelector('div[style*="transform"]');
            expect(shape).toHaveStyle('transform: rotate(45deg) translate(10px, 15px)');
        });

        it('generates consistent random sizes for same sector ID', () => {
            const data = [{ id: 1, hasShape: true, shape: 'square' as const }];

            const { unmount } = render(<ShapeGrid gridData={data} />);
            const firstSize = document.querySelector('div[style*="width"]')?.getAttribute('style');

            unmount();
            render(<ShapeGrid gridData={data} />);
            const secondSize = document.querySelector('div[style*="width"]')?.getAttribute('style');

            expect(firstSize).toBe(secondSize);
        });
    });

    // Edge cases
    describe('Edge Cases', () => {
        it('handles missing optional props gracefully', () => {
            const minimalData = [{ id: 1, hasShape: true, shape: 'square' as const }];

            expect(() => render(<ShapeGrid gridData={minimalData} />)).not.toThrow();

            const shape = document.querySelector('div[style*="transform"]');
            expect(shape).toHaveStyle('transform: rotate(0deg) translate(0px, 0px)');
        });

        it('works with large datasets', () => {
            const bigData = Array.from({ length: 16 }, (_, i) => ({
                id: i + 1,
                hasShape: i % 2 === 0,
                shape: 'circle' as const
            }));

            render(<ShapeGrid gridData={bigData} />);

            const sectors = document.querySelectorAll('.cursor-pointer');
            expect(sectors).toHaveLength(16);
        });
    });
});
