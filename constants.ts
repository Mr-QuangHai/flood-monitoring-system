import { SystemConfig } from './types';

export const SYSTEM_CONFIG: SystemConfig = {
  safeLimit: 200,
  warningLimit: 300,
  maxLevel: 500,
};

export const IMAGES = {
  // A university building resembling the description
  BANNER_BG: './dhv.jpg', 
  
  // Local logo file - ensure this file exists in the same folder as index.html
  LOGO: './logo.png' 
};

export const MOCK_INTERVAL_MS = 2000;
export const MAX_HISTORY_POINTS = 20;