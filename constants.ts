
import { BrowConfig } from './types';

const DEFAULT_SHAPE = {
  width: 145,
  archHeight: 30,
  bottomArch: 10,
  thickness: 16,
  curvature: 0.2 // Reduzido para um visual mais geométrico/reto como na foto
};

export const INITIAL_BROW_CONFIG: BrowConfig = {
  posX: 0,
  posY: -80,
  scale: 1.0,
  rotation: 0,
  ...DEFAULT_SHAPE,
  spacing: 50,
  showGuides: true,
  showVisagismGrid: true,
  opacity: 0.9,
  color: '#ffff00', // Amarelo da foto
  mirror: true,
  handleSize: 4.5,
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
  '#ffff00', // Amarelo Geométrico
  '#ffffff', 
  '#00ff00', 
  '#ff00ff', 
  '#00ffff',
  '#000000'
];
