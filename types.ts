
export interface SideOffset {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  // Propriedades de forma individuais para cada lado
  width: number;
  archHeight: number;
  thickness: number;
  curvature: number;
}

export interface BrowConfig {
  posX: number;
  posY: number;
  scale: number;
  rotation: number;
  thickness: number;
  curvature: number;
  archHeight: number;
  width: number;
  spacing: number;
  showGuides: boolean;
  showVisagismGrid: boolean;
  opacity: number;
  color: string;
  mirror: boolean;
  handleSize: number;
  targetSide: 'both' | 'left' | 'right';
  leftOffset: SideOffset;
  rightOffset: SideOffset;
}

export type ControlMode = 'position' | 'shape' | 'visagism' | 'style' | 'camera';
