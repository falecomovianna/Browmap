
import { BrowConfig } from './types';

export const INITIAL_BROW_CONFIG: BrowConfig = {
  posX: 0,
  posY: -60,
  scale: 1.1,
  rotation: 0,
  thickness: 10,
  curvature: 0.6,
  archHeight: 22,
  width: 120,
  spacing: 50,
  showGuides: true,
  showVisagismGrid: true,
  opacity: 0.8,
  color: '#ffff00',
  mirror: true,
  handleSize: 6,
  targetSide: 'both',
  leftOffset: { 
    x: 0, y: 0, scale: 1, rotation: 0, 
    width: 120, archHeight: 22, thickness: 10, curvature: 0.6 
  },
  rightOffset: { 
    x: 0, y: 0, scale: 1, rotation: 0,
    width: 120, archHeight: 22, thickness: 10, curvature: 0.6 
  }
};

export const COLORS = [
  '#ffff00', 
  '#ffffff', 
  '#00ff00', 
  '#ff00ff', 
  '#00ffff'  
];
