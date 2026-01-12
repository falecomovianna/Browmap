
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

  // Calculamos pontos de referência baseados nos offsets para a grade seguir os moldes
  const getPoints = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const startX = isLeft ? leftStart : rightStart;
    
    // Ponto inicial (base)
    const pStart = { x: startX + offset.x, y: offset.y };
    // Ponto alto (arco)
    const pArch = { x: startX + offset.x + (offset.width * 0.6 * dir), y: offset.y - offset.archHeight };
    // Ponto final (cauda)
    const pTail = { x: startX + offset.x + (offset.width * dir), y: offset.y + (offset.archHeight * 0.3) };
    
    return { pStart, pArch, pTail, thickness: offset.thickness };
  };

  const lPoints = getPoints('left', leftOffset);
  const rPoints = getPoints('right', rightOffset);

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
        {/* GRADE TÉCNICA DE VISAGISMO (Conforme imagem de referência) */}
        {showVisagismGrid && (
          <g stroke={color} strokeWidth="0.3" opacity={opacity * 0.5}>
            {/* Eixo Central Vertical */}
            <line x1="0" y1="-300" x2="0" y2="300" strokeWidth="0.8" />

            {/* Verticais de Início (Glabela) */}
            <line x1={lPoints.pStart.x} y1="-250" x2={lPoints.pStart.x} y2="250" />
            <line x1={rPoints.pStart.x} y1="-250" x2={rPoints.pStart.x} y2="250" />

            {/* Verticais dos Arcos (Pontos Altos) */}
            <line x1={lPoints.pArch.x} y1="-250" x2={lPoints.pArch.x} y2="250" strokeDasharray="2,2" />
            <line x1={rPoints.pArch.x} y1="-250" x2={rPoints.pArch.x} y2="250" strokeDasharray="2,2" />

            {/* Linhas Horizontais de Simetria */}
            {/* Base (Início inferior) */}
            <line x1="-200" y1={lPoints.pStart.y} x2="200" y2={rPoints.pStart.y} />
            {/* Topo do Início */}
            <line x1="-200" y1={lPoints.pStart.y + lPoints.thickness} x2="200" y2={rPoints.pStart.y + rPoints.thickness} />
            {/* Ponto Alto (Arco) */}
            <line x1="-200" y1={lPoints.pArch.y} x2="200" y2={rPoints.pArch.y} />

            {/* Mapeamento Cruzado (X Central) */}
            <line x1={lPoints.pStart.x} y1={lPoints.pStart.y} x2={rPoints.pStart.x} y2={rPoints.pArch.y} />
            <line x1={rPoints.pStart.x} y1={rPoints.pStart.y} x2={lPoints.pStart.x} y2={lPoints.pArch.y} />

            {/* Linhas de Cauda (V de mapeamento) */}
            <line x1="0" y1="200" x2={lPoints.pTail.x} y2={lPoints.pTail.y} />
            <line x1="0" y1="200" x2={rPoints.pTail.x} y2={rPoints.pTail.y} />
            
            {/* Cruzamento inferior para altura das sobrancelhas */}
            <line x1={lPoints.pStart.x} y1={lPoints.pStart.y} x2={rPoints.pStart.x} y2={rPoints.pStart.y} strokeWidth="1" />
          </g>
        )}

        {/* MOLDES INDIVIDUAIS */}
        <g fill="none">
          {/* Sobrancelha Esquerda */}
          <g transform={getSideTransform('left')} opacity={opacity}>
            <path 
              d={createHollowPath('left', leftOffset)} 
              stroke={color} 
              strokeWidth={targetSide === 'left' ? "2.5" : "1"} 
              className={targetSide === 'left' ? "drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : ""}
            />
          </g>
          
          {/* Sobrancelha Direita */}
          <g transform={getSideTransform('right')} opacity={opacity}>
            <path 
              d={createHollowPath('right', rightOffset)} 
              stroke={color} 
              strokeWidth={targetSide === 'right' ? "2.5" : "1"}
              className={targetSide === 'right' ? "drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : ""}
            />
          </g>
        </g>

        {/* PONTOS DE CONTROLE (HANDLES) */}
        {showGuides && (
          <g fill={color} stroke="#000" strokeWidth="0.3">
            {['left', 'right'].map((side) => {
              const isLeft = side === 'left';
              const off = isLeft ? leftOffset : rightOffset;
              const dir = isLeft ? -1 : 1;
              const { width: bW, archHeight: bH, thickness: t } = off;
              
              return (
                <g key={side} transform={getSideTransform(side as 'left' | 'right')} opacity={targetSide === 'both' || targetSide === side ? 1 : 0.2}>
                  {/* Início Inferior */}
                  <circle cx={0} cy={0} r={handleSize} />
                  {/* Início Superior */}
                  <circle cx={0} cy={t} r={handleSize} />
                  {/* Ponto Alto (Arco) */}
                  <circle cx={bW * 0.6 * dir} cy={-bH} r={handleSize} />
                  {/* Cauda */}
                  <circle cx={bW * dir} cy={bH * 0.3} r={handleSize} />
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
