// Core types for the verification system
export type ShapeType = "triangle" | "square" | "circle";
export type ColorTint = "red" | "green" | "blue";

export interface VerificationChallenge {
  id: string;
  type: 'shape_detection' | 'text_recognition' | 'object_identification';
  instruction: string;
  targetObjects?: string[];
  images?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserResponse {
  challengeId: string;
  selectedItems?: number[];
  textInput?: string;
  timestamp: number;
}

export interface GridSector {
  id: number;
  hasShape: boolean;
  shape: ShapeType;
  tint?: ColorTint;
  rotation?: number;
  jitter?: { x: number; y: number };
}

// Create sample verification challenges (for traditional captcha)
export const createSampleChallenge = (): VerificationChallenge => {
  const challenges: VerificationChallenge[] = [
    {
      id: 'traffic-lights',
      type: 'object_identification',
      instruction: 'Select all squares with traffic lights',
      targetObjects: ['traffic_light'],
      difficulty: 'easy'
    },
    {
      id: 'vehicles',
      type: 'object_identification', 
      instruction: 'Select all squares with cars',
      targetObjects: ['car'],
      difficulty: 'medium'
    },
    {
      id: 'crosswalks',
      type: 'object_identification',
      instruction: 'Click on all crosswalks in this image',
      targetObjects: ['crosswalk'],
      difficulty: 'hard'
    }
  ];
  
  return challenges[Math.floor(Math.random() * challenges.length)];
};

// Validate traditional captcha responses
export const validateCaptchaResponse = (
  _challenge: VerificationChallenge,
  response: UserResponse
): boolean => {
  // Basic validation - in production this would check against correct answers
  return response.selectedItems !== undefined && response.selectedItems.length > 0;
};

// Calculate performance score based on speed and accuracy
export const calculatePerformanceScore = (
  responseTimeMs: number,
  isCorrect: boolean
): number => {
  const baseScore = isCorrect ? 100 : 0;
  const speedBonus = Math.max(0, 50 - (responseTimeMs / 1000));
  return Math.round(baseScore + speedBonus);
};

// Generate unique session identifier
export const createSessionId = (): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${randomSuffix}`;
};

// Create secure grid layout for shape-based verification
export const generateShapeGrid = (targetShape: ShapeType, targetTint: ColorTint): GridSector[] => {
  const allShapes: ShapeType[] = ["triangle", "square", "circle"];
  const allTints: ColorTint[] = ["red", "green", "blue"];
  const sectors: GridSector[] = [];
  
  // Ensure 2-4 target shapes for better user experience
  const targetCount = Math.floor(Math.random() * 3) + 2;
  let targetsPlaced = 0;
  
  for (let i = 0; i < 16; i++) {
    const shouldPlaceTarget = targetsPlaced < targetCount && Math.random() < 0.3;
    const hasShape = shouldPlaceTarget || Math.random() < 0.6;
    
    if (hasShape) {
      let shape: ShapeType;
      let tint: ColorTint;
      
      if (shouldPlaceTarget) {
        shape = targetShape;
        tint = targetTint;
        targetsPlaced++;
      } else {
        // Create decoy shapes
        shape = allShapes[Math.floor(Math.random() * allShapes.length)];
        tint = allTints[Math.floor(Math.random() * allTints.length)];
        
        // Avoid accidental target matches
        if (shape === targetShape && tint === targetTint) {
          tint = allTints.find(t => t !== targetTint) || "red";
        }
      }
      
      sectors.push({
        id: i,
        hasShape: true,
        shape,
        tint,
        rotation: Math.random() * 360,
        jitter: {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8
        }
      });
    } else {
      sectors.push({
        id: i,
        hasShape: false,
        shape: "triangle", // placeholder
      });
    }
  }
  
  return sectors;
};

// Validate user selections against target criteria
export const validateShapeSelection = (
  sectors: GridSector[],
  selectedIds: number[],
  targetShape: ShapeType,
  targetTint: ColorTint
): boolean => {
  const correctIds = sectors
    .filter(sector => 
      sector.hasShape && 
      sector.shape === targetShape && 
      sector.tint === targetTint
    )
    .map(sector => sector.id);
  
  return (
    correctIds.length === selectedIds.length &&
    correctIds.every(id => selectedIds.includes(id)) &&
    selectedIds.every(id => correctIds.includes(id))
  );
};

// Generate visual noise to prevent automated analysis
export const createAntiAutomationNoise = (density: number = 10): Array<{ x: number; y: number }> => {
  return Array.from({ length: density }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100
  }));
};

// Convert square coordinates for responsive positioning
export const calculateResponsivePosition = (
  squarePos: { x: number; y: number },
  videoWidth: number = 640,
  videoHeight: number = 480
): { leftPercent: number; topPercent: number } => {
  return {
    leftPercent: (squarePos.x / videoWidth) * 100,
    topPercent: (squarePos.y / videoHeight) * 100
  };
};
