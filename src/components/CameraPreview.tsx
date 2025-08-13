import React from 'react';

interface CameraPreviewProps {
    className?: string;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ className = '' }) => {
    return (
        <div className={`bg-gray-200 rounded-lg ${className}`}>
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Camera Preview Component</p>
            </div>
        </div>
    );
};

export default CameraPreview;
