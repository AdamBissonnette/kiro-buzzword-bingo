export interface CardData {
  id: string;
  title: string;
  terms: string[];
  freeSpaceImage?: string;
  freeSpaceIcon?: string; // Icon ID for free space
  arrangement?: number[]; // Randomized term indices
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationErrors {
  title?: string;
  terms?: string;
  freeSpaceImage?: string;
  general?: string;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  retryable?: boolean;
}

export interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  retryCount: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'PDF_EXPORT_ERROR' 
  | 'URL_PARSING_ERROR'
  | 'NETWORK_ERROR'
  | 'BROWSER_COMPATIBILITY_ERROR'
  | 'UNKNOWN_ERROR';