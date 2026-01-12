
import { BrowConfig } from './types';

const DEFAULT_SHAPE = {
  width: 120,
  archHeight: 22,
  thickness: 10,
  curvature: 0.6
};

export const INITIAL_BROW_CONFIG: BrowConfig = {
  posX: 0,
  posY: -60,
  scale: 1.1,
  rotation: 0,
  ...DEFAULT_SHAPE,
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
    ...DEFAULT_SHAPE 
  },
  rightOffset: { 
    x: 0, y: 0, scale: 1, rotation: 0,
    ...DEFAULT_SHAPE 
  }
};

export const COLORS = [
  '#ffff00', 
  '#ffffff', 
  '#00ff00', 
  '#ff00ff', 
  '#00ffff',
  '#ff4400'
];
