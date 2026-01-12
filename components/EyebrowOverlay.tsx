
import React from 'react';
import { BrowConfig, SideOffset } from '../types';

interface EyebrowOverlayProps {
  config: BrowConfig;
}

const EyebrowOverlay: React.FC<EyebrowOverlayProps> = ({ config }) => {
  const { 
    posX, posY, scale, rotation, 
    spacing, showGuides, showVisagismGrid, 
    opacity, color, handleSize,
    leftOffset, rightOffset, targetSide
  } = config;

  const s = spacing / 2;
  const leftStart = -s;
  const rightStart = s;

  // Pontos de ancoragem para a grade
  const getPoints = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const startX = isLeft ? leftStart : rightStart;
    
    // Posições absolutas dentro do contexto transformado do SVG
    const pStart = { x: startX + offset.x, y: offset.y };
    const pArch = { x: startX + offset.x + (offset.width * 0.6 * dir), y: offset.y - offset.archHeight };
    const pTail = { x: startX + offset.x + (offset.width * dir), y: offset.y + (offset.archHeight * 0.2) };
    
    return { pStart, pArch, pTail, thickness: offset.thickness };
  };

  const lPts = getPoints('left', leftOffset);
  const rPts = getPoints('right', rightOffset);

  const createHollowPath = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const { width: bW, archHeight: bH, thickness: t, curvature: curv } = offset;

    const p1 = { x: 0, y: 0 };
    const p2 = { x: bW * 0.6 * dir, y: -bH };
    const p3 = { x: bW * dir, y: bH * 0.2 };

    const p4 = { x: bW * dir, y: bH * 0.2 + 1 };
    const p5 = { x: bW * 0.6 * dir, y: -bH + t };
    const p6 = { x: 0, y: t };

    return `
      M ${p1.x} ${p1.y} 
      Q ${bW * 0.3 * dir} ${-curv * 15}, ${p2.x} ${p2.y}
      Q ${bW * 0.85 * dir} ${p2.y + 5}, ${p3.x} ${p3.y}
      L ${p4.x} ${p4.y}
      Q ${bW * 0.85 * dir} ${p5.y + 5}, ${p5.x} ${p5.y}
      Q ${bW * 0.3 * dir} ${p6.y - (curv * 10)}, ${p6.x} ${p6.y}
      Z
    `;
  };

  const getSideTransform = (side: 'left' | 'right') => {
    const off = side === 'left' ? leftOffset : rightOffset;
    const startX = side === 'left' ? leftStart : rightStart;
    return `translate(${startX + off.x}, ${off.y}) rotate(${off.rotation}) scale(${off.scale})`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg 
        viewBox="-250 -250 500 500" 
        className="w-full h-full overflow-visible"
        style={{ transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})` }}
      >
        {/* GRADE DE VISAGISMO PROFISSIONAL */}
        {showVisagismGrid && (
          <g stroke={color} strokeWidth="0.4" opacity={opacity * 0.5}>
            {/* Eixo Central */}
            <line x1="0" y1="-350" x2="0" y2="350" strokeWidth="1" />

            {/* Verticais de Início */}
            <line x1={lPts.pStart.x} y1="-300" x2={lPts.pStart.x} y2="300" />
            <line x1={rPts.pStart.x} y1="-300" x2={rPts.pStart.x} y2="300" />

            {/* Verticais de Ponto Alto */}
            <line x1={lPts.pArch.x} y1="-300" x2={lPts.pArch.x} y2="300" strokeDasharray="3,3" />
            <line x1={rPts.pArch.x} y1="-300" x2={rPts.pArch.x} y2="300" strokeDasharray="3,3" />

            {/* Horizontais de Simetria */}
            <line x1="-200" y1={lPts.pStart.y} x2="200" y2={rPts.pStart.y} />
            <line x1="-200" y1={lPts.pArch.y} x2="200" y2={rPts.pArch.y} />
            <line x1="-200" y1={lPts.pStart.y + lPts.thickness} x2="200" y2={rPts.pStart.y + rPts.thickness} />

            {/* Cruzamento de Mapeamento (X Central) */}
            <line x1={lPts.pStart.x} y1={lPts.pStart.y} x2={rPts.pStart.x} y2={rPts.pArch.y} />
            <line x1={rPts.pStart.x} y1={rPts.pStart.y} x2={lPts.pStart.x} y2={lPts.pArch.y} />

            {/* Guia de Cauda (V invertido) */}
            <line x1="0" y1="200" x2={lPts.pTail.x} y2={lPts.pTail.y} />
            <line x1="0" y1="200" x2={rPts.pTail.x} y2={rPts.pTail.y} />
          </g>
        )}

        {/* MOLDES DE SOBRANCELHA */}
        <g fill="none">
          {/* LADO ESQUERDO */}
          <g transform={getSideTransform('left')} opacity={opacity}>
            <path 
              d={createHollowPath('left', leftOffset)} 
              stroke={color} 
              strokeWidth={targetSide === 'left' ? "2.5" : "1"} 
              className={targetSide === 'left' ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" : ""}
            />
          </g>
          
          {/* LADO DIREITO */}
          <g transform={getSideTransform('right')} opacity={opacity}>
            <path 
              d={createHollowPath('right', rightOffset)} 
              stroke={color} 
              strokeWidth={targetSide === 'right' ? "2.5" : "1"}
              className={targetSide === 'right' ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" : ""}
            />
          </g>
        </g>

        {/* HANDLES DE CONTROLE */}
        {showGuides && (
          <g fill={color} stroke="#000" strokeWidth="0.5">
            {['left', 'right'].map((side) => {
              const s = side as 'left' | 'right';
              const off = s === 'left' ? leftOffset : rightOffset;
              const dir = s === 'left' ? -1 : 1;
              return (
                <g key={s} transform={getSideTransform(s)} opacity={targetSide === 'both' || targetSide === s ? 1 : 0.3}>
                  <circle cx={0} cy={0} r={handleSize} />
                  <circle cx={0} cy={off.thickness} r={handleSize} />
                  <circle cx={off.width * 0.6 * dir} cy={-off.archHeight} r={handleSize} />
                  <circle cx={off.width * dir} cy={off.archHeight * 0.2} r={handleSize} />
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
