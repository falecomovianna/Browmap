
import React from 'react';
import { BrowConfig, SideOffset, ActiveHandle } from '../types';

interface EyebrowOverlayProps {
  config: BrowConfig;
  activeHandle?: ActiveHandle | null;
}

const EyebrowOverlay: React.FC<EyebrowOverlayProps> = ({ config, activeHandle }) => {
  const { 
    posX, posY, scale, rotation, 
    spacing, showGuides, showVisagismGrid, 
    opacity, color, handleSize,
    leftOffset, rightOffset, targetSide
  } = config;

  const s = spacing / 2;

  // Professional Curvature Logic
  const createMappingPath = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const { width: w, archHeight: ah, thickness: t, bottomArch: ba, curvature: curv } = offset;

    const pTopStart = { x: 0, y: 0 };
    const pTopArch = { x: w * 0.62 * dir, y: -ah };
    const pTail = { x: w * dir, y: ah * 0.4 };
    const pBottomArch = { x: w * 0.60 * dir, y: -ah + t + ba };
    const pBottomStart = { x: 0, y: t };

    // Blend between straight mapping lines and soft design curves
    if (curv <= 0.1) {
      return `
        M ${pTopStart.x} ${pTopStart.y}
        L ${pTopArch.x} ${pTopArch.y}
        L ${pTail.x} ${pTail.y}
        L ${pBottomArch.x} ${pBottomArch.y}
        L ${pBottomStart.x} ${pBottomStart.y}
        Z
      `;
    } else {
      const c = curv * 20; // Scale curvature
      return `
        M ${pTopStart.x} ${pTopStart.y}
        Q ${pTopArch.x * 0.5} ${pTopArch.y - c}, ${pTopArch.x} ${pTopArch.y}
        Q ${pTopArch.x + (pTail.x - pTopArch.x) * 0.5} ${pTopArch.y + (pTail.y - pTopArch.y) * 0.5 - c}, ${pTail.x} ${pTail.y}
        Q ${pTail.x - (pTail.x - pBottomArch.x) * 0.5} ${pTail.y + (pBottomArch.y - pTail.y) * 0.5 + c}, ${pBottomArch.x} ${pBottomArch.y}
        Q ${pBottomArch.x * 0.5} ${pBottomArch.y + c}, ${pBottomStart.x} ${pBottomStart.y}
        Z
      `;
    }
  };

  const getPoints = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const startX = (isLeft ? -s : s) + offset.x;
    const { width: w, archHeight: ah, thickness: t, bottomArch: ba } = offset;
    
    return {
      topStart: { x: startX, y: offset.y },
      bottomStart: { x: startX, y: offset.y + t },
      topArch: { x: startX + (w * 0.62 * dir), y: offset.y - ah },
      bottomArch: { x: startX + (w * 0.60 * dir), y: offset.y - ah + t + ba },
      tail: { x: startX + (w * dir), y: offset.y + (ah * 0.4) }
    };
  };

  const l = getPoints('left', leftOffset);
  const r = getPoints('right', rightOffset);

  const getSideTransform = (side: 'left' | 'right') => {
    const off = side === 'left' ? leftOffset : rightOffset;
    const startX = side === 'left' ? -s : s;
    return `translate(${startX + off.x}, ${off.y}) rotate(${off.rotation}) scale(${off.scale})`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg 
        viewBox="-250 -250 500 500" 
        className="w-full h-full overflow-visible transition-all duration-300"
        style={{ transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})` }}
      >
        {showVisagismGrid && (
          <g stroke={color} strokeWidth="0.5" opacity="0.3">
            {/* Horizontal Alignment Guides */}
            <line x1="-300" y1={l.topStart.y} x2="300" y2={l.topStart.y} strokeDasharray="5,5" />
            <line x1="-300" y1={l.topArch.y} x2="300" y2={l.topArch.y} strokeDasharray="3,3" />
            
            {/* Golden Ratio Facial Triangles */}
            <line x1="0" y1="280" x2={l.tail.x} y2={l.tail.y} strokeWidth="0.8" />
            <line x1="0" y1="280" x2={r.tail.x} y2={r.tail.y} strokeWidth="0.8" />
            <line x1="0" y1="280" x2={l.topStart.x} y2={l.topStart.y} strokeWidth="1" />
            <line x1="0" y1="280" x2={r.topStart.x} y2={r.topStart.y} strokeWidth="1" />
            
            {/* Vertical midline */}
            <line x1="0" y1="-300" x2="0" y2="300" strokeWidth="0.5" strokeDasharray="10,10" />
          </g>
        )}

        <g fill="none">
          {['left', 'right'].map((side) => (
            <g key={side} transform={getSideTransform(side as 'left' | 'right')} opacity={opacity}>
              <path 
                d={createMappingPath(side as 'left' | 'right', side === 'left' ? leftOffset : rightOffset)} 
                stroke={color} 
                strokeWidth={targetSide === side ? "3.2" : "1.8"}
                fill={color}
                fillOpacity="0.08"
                className="transition-all duration-300"
              />
            </g>
          ))}
        </g>

        {showGuides && (
          <g fill={color} stroke="#000" strokeWidth="0.7">
            {['left', 'right'].map((side) => {
              const sSide = side as 'left' | 'right';
              const off = sSide === 'left' ? leftOffset : rightOffset;
              const dir = sSide === 'left' ? -1 : 1;
              const isActiveSide = targetSide === 'both' || targetSide === sSide;
              const isType = (t: string) => activeHandle?.side === sSide && activeHandle?.type === t;
              
              const radius = (t: string) => isType(t) ? handleSize * 2.2 : handleSize;

              return (
                <g key={sSide} transform={getSideTransform(sSide)} opacity={isActiveSide ? 1 : 0.3}>
                  <circle cx={0} cy={0} r={radius('pos')} />
                  <circle cx={0} cy={off.thickness} r={radius('thickness')} />
                  <circle cx={off.width * 0.62 * dir} cy={-off.archHeight} r={radius('arch')} />
                  <circle cx={off.width * 0.60 * dir} cy={-off.archHeight + off.thickness + off.bottomArch} r={radius('bottomArch')} />
                  <circle cx={off.width * dir} cy={off.archHeight * 0.4} r={radius('width')} />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};

export default EyebrowOverlay;
