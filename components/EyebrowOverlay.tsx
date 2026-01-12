
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

  // Função para criar o formato geométrico (Mapping Style da Foto)
  const createMappingPath = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const { width: w, archHeight: ah, thickness: t, bottomArch: ba } = offset;

    const pTopStart = { x: 0, y: 0 };
    const pTopArch = { x: w * 0.62 * dir, y: -ah };
    const pTail = { x: w * dir, y: ah * 0.4 };
    const pBottomArch = { x: w * 0.60 * dir, y: -ah + t + ba };
    const pBottomStart = { x: 0, y: t };

    return `
      M ${pTopStart.x} ${pTopStart.y}
      L ${pTopArch.x} ${pTopArch.y}
      L ${pTail.x} ${pTail.y}
      L ${pBottomArch.x} ${pBottomArch.y}
      L ${pBottomStart.x} ${pBottomStart.y}
      Z
    `;
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
        className="w-full h-full overflow-visible"
        style={{ transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})` }}
      >
        {showVisagismGrid && (
          <g stroke="#000" strokeWidth="0.8" opacity="0.6">
            {/* Linhas Verticais e Grid de Cruzamento da Foto */}
            <line x1={l.topStart.x} y1="-300" x2={l.topStart.x} y2="300" strokeWidth="1" />
            <line x1={r.topStart.x} y1="-300" x2={r.topStart.x} y2="300" strokeWidth="1" />
            
            {/* Triângulo de Base do Nariz (V-Shape) */}
            <line x1="0" y1="280" x2={l.tail.x} y2={l.tail.y} />
            <line x1="0" y1="280" x2={r.tail.x} y2={r.tail.y} />
            <line x1="0" y1="280" x2={l.topStart.x} y2={l.topStart.y} />
            <line x1="0" y1="280" x2={r.topStart.x} y2={r.topStart.y} />

            {/* Cruzamentos Centrais Forehead */}
            <line x1={l.topStart.x} y1={l.topStart.y} x2={r.topArch.x} y2={r.topArch.y} strokeWidth="0.4" />
            <line x1={r.topStart.x} y1={r.topStart.y} x2={l.topArch.x} y2={l.topArch.y} strokeWidth="0.4" />
            <line x1={l.topStart.x} y1={l.topStart.y - 30} x2={r.topArch.x} y2={r.topArch.y} strokeWidth="0.3" strokeDasharray="2,2" />
            <line x1={r.topStart.x} y1={r.topStart.y - 30} x2={l.topArch.x} y2={l.topArch.y} strokeWidth="0.3" strokeDasharray="2,2" />
          </g>
        )}

        <g fill="none">
          {['left', 'right'].map((side) => (
            <g key={side} transform={getSideTransform(side as 'left' | 'right')} opacity={opacity}>
              <path 
                d={createMappingPath(side as 'left' | 'right', side === 'left' ? leftOffset : rightOffset)} 
                stroke={color} 
                strokeWidth={targetSide === side ? "2.5" : "1.2"}
                fill={color}
                fillOpacity="0.08"
              />
            </g>
          ))}
        </g>

        {showGuides && (
          <g fill={color} stroke="#000" strokeWidth="0.6">
            {['left', 'right'].map((side) => {
              const s = side as 'left' | 'right';
              const off = s === 'left' ? leftOffset : rightOffset;
              const dir = s === 'left' ? -1 : 1;
              const isActiveSide = targetSide === 'both' || targetSide === s;
              const isType = (t: string) => activeHandle?.side === s && activeHandle?.type === t;
              
              const radius = (t: string) => isType(t) ? handleSize * 1.6 : handleSize;

              return (
                <g key={s} transform={getSideTransform(s)} opacity={isActiveSide ? 1 : 0.4}>
                  <circle cx={0} cy={0} r={radius('pos')} />
                  <circle cx={0} cy={off.thickness} r={radius('thickness')} />
                  <circle cx={off.width * 0.62 * dir} cy={-off.archHeight} r={radius('arch')} />
                  <circle cx={off.width * 0.60 * dir} cy={-off.archHeight + off.thickness + off.bottomArch} r={radius('bottomArch')} />
                  <circle cx={off.width * dir} cy={off.archHeight * 0.4} r={radius('width')} />
                </g>
              );
            })}

            {/* Pontos Amarelos de Intersecção Central (Yellow Dots) */}
            {showVisagismGrid && (
              <g opacity="0.9">
                 <circle cx="0" cy={l.topStart.y - 15} r={handleSize * 0.7} />
                 <circle cx="0" cy={l.topStart.y - 45} r={handleSize * 0.7} />
                 <circle cx="0" cy={l.topStart.y - 75} r={handleSize * 0.7} />
                 <circle cx="0" cy={l.topStart.y + 10} r={handleSize * 0.7} />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export default EyebrowOverlay;
