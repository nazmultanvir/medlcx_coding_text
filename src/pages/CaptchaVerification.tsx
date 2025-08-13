import React, { useState, useRef, useEffect, useCallback } from 'react';
import ShapeGrid from '../components/ShapeGrid';

type VerificationStep = "camera" | "selection" | "results";
type ShapeType = "triangle" | "square" | "circle";
type ColorTint = "red" | "green" | "blue";

interface CaptchaVerificationProps {
    onComplete?: (success: boolean) => void;
}

interface GridSector {
    id: number;
    hasShape: boolean;
    shape: ShapeType;
    tint?: ColorTint;
    rotation?: number;
    jitter?: { x: number; y: number };
}

interface Position {
    x: number;
    y: number;
}

// Constrains square position within video bounds
const keepSquareInBounds = (
    position: Position,
    videoWidth: number,
    videoHeight: number,
    squareSize: number
): { left: string; top: string } => {
    const x = Math.max(0, Math.min(videoWidth - squareSize, position.x));
    const y = Math.max(0, Math.min(videoHeight - squareSize, position.y));

    return {
        left: `${x}px`,
        top: `${y}px`,
    };
};

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({ onComplete }) => {
    // Camera and permissions
    const [cameraState, setCameraState] = useState<'requesting' | 'allowed' | 'blocked'>('requesting');

    // Verification flow
    const [currentStep, setCurrentStep] = useState<VerificationStep>("camera");
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [squarePosition, setSquarePosition] = useState<Position>({ x: 50, y: 50 });
    const [lockedPosition, setLockedPosition] = useState<Position | null>(null);
    const [gridSectors, setGridSectors] = useState<GridSector[]>([]);
    const [selectedSectors, setSelectedSectors] = useState<number[]>([]);
    const [result, setResult] = useState<"PASS" | "FAIL" | null>(null);
    const [targetShape, setTargetShape] = useState<ShapeType>("triangle");
    const [targetTint, setTargetTint] = useState<ColorTint>("red");
    const [attemptsMade, setAttemptsMade] = useState(0);
    const [isValidating, setIsValidating] = useState(false);

    // DOM refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const movementTimer = useRef<NodeJS.Timeout | null>(null);

    const requestCameraAccess = useCallback(async () => {
        try {
            setCameraState('requesting');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
                audio: false
            });
            setCameraState('allowed');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error) {
            console.error("Camera access denied:", error);
            setTimeout(() => setCameraState('blocked'), 1000);
        }
    }, []);

    const getRandomSquarePosition = useCallback((): Position => {
        const padding = 50; // Keep square away from edges
        return {
            x: Math.random() * (590 - padding * 2) + padding,
            y: Math.random() * (430 - padding * 2) + padding
        };
    }, []);

    const startSquareAnimation = useCallback(() => {
        if (movementTimer.current) {
            clearInterval(movementTimer.current);
        }

        movementTimer.current = setInterval(() => {
            setSquarePosition(getRandomSquarePosition());
        }, 1000);
    }, [getRandomSquarePosition]);

    const captureCurrentFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Match canvas to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Capture the frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Save as image data
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);

        // Lock square position
        setLockedPosition({ ...squarePosition });

        // Stop animation and camera
        if (movementTimer.current) {
            clearInterval(movementTimer.current);
            movementTimer.current = null;
        }

        const stream = video.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Generate challenge and proceed
        createShapeChallenge();
        setCurrentStep("selection");
    }, [squarePosition]);

    const createShapeChallenge = useCallback(() => {
        const allShapes: ShapeType[] = ["triangle", "square", "circle"];
        const allTints: ColorTint[] = ["red", "green", "blue"];
        const newSectors: GridSector[] = [];

        // Create 4x4 grid first
        for (let i = 0; i < 16; i++) {
            const hasShape = Math.random() < 0.6; // Slightly higher chance for shapes

            if (hasShape) {
                const shape = allShapes[Math.floor(Math.random() * allShapes.length)];
                const tint = allTints[Math.floor(Math.random() * allTints.length)];

                newSectors.push({
                    id: i,
                    hasShape: true,
                    shape,
                    tint,
                    rotation: Math.random() * 360,
                    jitter: {
                        x: (Math.random() - 0.5) * 10,
                        y: (Math.random() - 0.5) * 10
                    }
                });
            } else {
                newSectors.push({
                    id: i,
                    hasShape: false,
                    shape: "triangle", // placeholder
                });
            }
        }

        // Get all unique shape/tint combinations that exist in the grid
        const availableCombinations = newSectors
            .filter(sector => sector.hasShape && sector.tint)
            .map(sector => ({ shape: sector.shape, tint: sector.tint! }))
            .filter((combo, index, self) =>
                self.findIndex(c => c.shape === combo.shape && c.tint === combo.tint) === index
            );

        // If no shapes exist, create at least one
        if (availableCombinations.length === 0) {
            const fallbackShape = allShapes[Math.floor(Math.random() * allShapes.length)];
            const fallbackTint = allTints[Math.floor(Math.random() * allTints.length)];

            // Replace a random empty sector with our fallback shape
            const emptySectors = newSectors.filter(sector => !sector.hasShape);
            if (emptySectors.length > 0) {
                const randomEmpty = emptySectors[Math.floor(Math.random() * emptySectors.length)];
                const sectorIndex = newSectors.findIndex(s => s.id === randomEmpty.id);

                newSectors[sectorIndex] = {
                    id: randomEmpty.id,
                    hasShape: true,
                    shape: fallbackShape,
                    tint: fallbackTint,
                    rotation: Math.random() * 360,
                    jitter: {
                        x: (Math.random() - 0.5) * 10,
                        y: (Math.random() - 0.5) * 10
                    }
                };

                availableCombinations.push({ shape: fallbackShape, tint: fallbackTint });
            }
        }

        // Pick target from available combinations
        const targetCombo = availableCombinations[Math.floor(Math.random() * availableCombinations.length)];
        setTargetShape(targetCombo.shape);
        setTargetTint(targetCombo.tint);

        setGridSectors(newSectors);
        setSelectedSectors([]);
    }, []);

    const validateUserSelection = useCallback(() => {
        setIsValidating(true);

        // Find correct sectors
        const correctSectors = gridSectors
            .filter(sector =>
                sector.hasShape &&
                sector.shape === targetShape &&
                sector.tint === targetTint
            )
            .map(sector => sector.id);

        // Check if selection matches
        const isCorrect =
            correctSectors.length === selectedSectors.length &&
            correctSectors.every(id => selectedSectors.includes(id)) &&
            selectedSectors.every(id => correctSectors.includes(id));

        setTimeout(() => {
            const success = isCorrect;
            setResult(success ? "PASS" : "FAIL");
            setIsValidating(false);

            // Call the completion callback immediately if provided
            if (onComplete) {
                // Small delay to show the validation feedback, then return to App
                setTimeout(() => {
                    onComplete(success);
                }, 500);
            } else {
                // Only show results step if no callback is provided (standalone mode)
                setCurrentStep("results");
            }
        }, 1000);
    }, [gridSectors, targetShape, targetTint, selectedSectors, onComplete]);

    const restartVerification = useCallback(() => {
        if (attemptsMade >= 3) {
            alert("Too many attempts. Please refresh to try again.");
            if (onComplete) {
                onComplete(false);
            }
            return;
        }

        setAttemptsMade(prev => prev + 1);
        setCurrentStep("camera");
        setCapturedPhoto(null);
        setLockedPosition(null);
        setGridSectors([]);
        setSelectedSectors([]);
        setResult(null);
        setSquarePosition({ x: 50, y: 50 });

        requestCameraAccess();
        startSquareAnimation();
    }, [attemptsMade, requestCameraAccess, startSquareAnimation, onComplete]);

    const toggleSector = useCallback((sectorId: number) => {
        setSelectedSectors(prev =>
            prev.includes(sectorId)
                ? prev.filter(id => id !== sectorId)
                : [...prev, sectorId]
        );
    }, []);

    // Initialize on mount
    useEffect(() => {
        if (currentStep === "camera") {
            requestCameraAccess();
            startSquareAnimation();
        }

        return () => {
            if (movementTimer.current) {
                clearInterval(movementTimer.current);
            }
        };
    }, [currentStep, requestCameraAccess, startSquareAnimation]);

    const renderCameraStep = () => (
        <div className="text-center bg-white py-8 px-16">
            <h2 className="text-2xl text-brand-navy mb-6">Take Your Photo</h2>

            {cameraState === 'requesting' && (
                <div className="text-gray-500 text-lg mb-6 min-w-[648px] min-h-[488px] flex items-center justify-center">
                    Accessing camera...
                </div>
            )}

            {cameraState === 'blocked' && (
                <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-6 min-w-[648px] min-h-[488px] border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                        <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                            <circle cx="14" cy="14" r="14" fill="#F87171" />
                            <path d="M9 9l10 10M19 9l-10 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="text-red-600 font-semibold text-base">Camera Blocked</span>
                    </div>
                    <div className="text-gray-700 text-sm text-center mb-4">
                        Please allow camera access in your browser settings and try again.
                    </div>
                    <button
                        className="bg-brand-gold hover:bg-yellow-600 text-white py-2 px-4 rounded-md shadow transition-colors"
                        onClick={requestCameraAccess}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {cameraState === 'allowed' && (
                <div className="relative inline-block min-w-[648px] min-h-[488px]">
                    <video
                        ref={videoRef}
                        className="rounded-sm border-2 border-white"
                        width="640"
                        height="480"
                        playsInline
                        muted
                    />

                    <div
                        className="absolute border-2 border-gray-50 transition-all duration-1000"
                        style={{
                            width: '200px',
                            height: '200px',
                            ...keepSquareInBounds(squarePosition, 640, 480, 200),
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    />

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}

            <div className="mt-6">
                <button
                    onClick={captureCurrentFrame}
                    className="bg-brand-gold uppercase hover:bg-yellow-600 text-white py-1 px-6 transition-colors text-lg"
                    disabled={cameraState !== 'allowed'}
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const renderSelectionStep = () => (
        <div className="text-center bg-white py-8 px-16">
            <h2 className="text-2xl text-brand-navy mb-6">
                Select all <span className="font-bold text-brand-gold">{targetShape}s</span> with{' '}
                <span className="font-bold text-brand-gold">{targetTint}</span> tint
            </h2>

            {capturedPhoto && lockedPosition && (
                <div className="relative inline-block">
                    <img
                        src={capturedPhoto}
                        alt="Your photo"
                        className="border-2 border-white"
                        style={{ maxWidth: '640px', height: 'auto' }}
                    />

                    <div
                        className="absolute border-2 border-brand-gold"
                        style={{
                            width: '200px',
                            height: '200px',
                            ...keepSquareInBounds(lockedPosition, 640, 480, 200),
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    >
                        <ShapeGrid
                            gridData={gridSectors}
                            selectedSectors={selectedSectors}
                            onSectorToggle={toggleSector}
                            className="w-full h-full"
                        />
                    </div>
                </div>
            )}

            <div className="mt-6">
                <button
                    onClick={validateUserSelection}
                    disabled={isValidating || selectedSectors.length === 0}
                    className="bg-brand-gold uppercase hover:bg-yellow-600 text-white py-1 px-6 transition-colors text-lg disabled:bg-gray-400"
                >
                    {isValidating ? 'Checking...' : 'Submit'}
                </button>
            </div>
        </div>
    );

    const renderResultsStep = () => (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Verification Complete</h2>

            <div className="mb-6">
                {result === "PASS" ? (
                    <div className="text-success-green text-4xl font-bold">
                        ✓ Verified!
                    </div>
                ) : (
                    <div className="text-red-400 text-4xl font-bold">
                        ✗ Verification Failed
                    </div>
                )}
            </div>

            {result === "FAIL" && attemptsMade < 3 && (
                <button
                    onClick={restartVerification}
                    className="bg-brand-gold hover:bg-yellow-600 text-brand-navy font-bold py-3 px-8 rounded-lg transition-colors text-lg mr-4"
                >
                    Try Again ({3 - attemptsMade} left)
                </button>
            )}

            <button
                onClick={() => window.location.reload()}
                className="bg-white hover:bg-gray-100 text-brand-navy font-bold py-3 px-8 rounded-lg transition-colors text-lg"
            >
                Start Over
            </button>
        </div>
    );

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200">
            <div className="bg-brand-navy px-16 py-14">
                {currentStep === "camera" && renderCameraStep()}
                {currentStep === "selection" && renderSelectionStep()}
                {currentStep === "results" && renderResultsStep()}
            </div>
        </div>
    );
};

export default CaptchaVerification;
