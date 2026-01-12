import { BrowConfig } from './types';

const DEFAULT_SHAPE = {
  width: 155,
  archHeight: 45,
  bottomArch: 10,
  thickness: 16,
  curvature: 0.01 // Design retilíneo de marcação com linha
};

export const INITIAL_BROW_CONFIG: BrowConfig = {
  posX: 0,
  posY: -95,
  scale: 1.0,
  rotation: 0,
  ...DEFAULT_SHAPE,
  spacing: 52, 
  showGuides: true,
  showVisagismGrid: true,
  opacity: 0.7,
  color: '#ffff00', // Amarelo marcador profissional (conforme foto)
  mirror: true,
  handleSize: 5,
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
  '#ffff00', // Amarelo Mapeamento
  '#ffffff', 
  '#00ff00', 
  '#ff00ff', 
  '#00ffff',
  '#ff4444'
];