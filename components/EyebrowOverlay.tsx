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

  // Cálculo dos pontos baseados na anatomia facial e visagismo (Razão Áurea)
  const getPoints = (side: 'left' | 'right', offset: SideOffset) => {
    const isLeft = side === 'left';
    const dir = isLeft ? -1 : 1;
    const startX = (isLeft ? -s : s) + offset.x;
    const { width: w, archHeight: ah, thickness: t, bottomArch: ba } = offset;
    
    // Proporção Áurea para o ponto alto (Pico/Arco)
    const archDist = w * 0.618;

    return {
      topStart: { x: startX, y: offset.y },
      bottomStart: { x: startX, y: offset.y + t },
      topArch: { x: startX + (archDist * dir), y: offset.y - ah },
      bottomArch: { x: startX + (archDist * 0.95 * dir), y: offset.y - ah + t + ba },
      tail: { x: startX + (w * dir), y: offset.y + (ah * 0.1) }
    };
  };

  const l = getPoints('left', leftOffset);
  const r = getPoints('right', rightOffset);

  // Origem técnica das diagonais (Asa do nariz / Filtro Labial)
  const originY = 340;
  const originX = 0;

  // Gera o caminho do molde (Sobrancelha) usando segmentos retos (Mapping de régua)
  const createMappingPath = (side: 'left' | 'right', offset: SideOffset) => {
    const p = getPoints(side, offset);
    return `M ${p.topStart.x} ${p.topStart.y} L ${p.topArch.x} ${p.topArch.y} L ${p.tail.x} ${p.tail.y} L ${p.bottomArch.x} ${p.bottomArch.y} L ${p.bottomStart.x} ${p.bottomStart.y} Z`;
  };

  const MappingLine = ({ x1, y1, x2, y2, opacity = 0.5, color = "black" }: any) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.5" opacity={opacity} />
  );

  const YellowDot = ({ x, y, size = 3 }: { x: number, y: number, size?: number }) => (
    <circle cx={x} cy={y} r={size} fill="#ffff00" stroke="#000" strokeWidth="0.5" className="filter drop-shadow-sm" />
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg 
        viewBox="-250 -250 500 500" 
        className="w-full h-full overflow-visible"
        style={{ 
            transform: `translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale})`,
        }}
      >
        {/* Grade de Visagismo (Linhas Pretas Finas - 0.5px) */}
        {showVisagismGrid && (
          <g>
            {/* 1. Linha Vertical Central (Glabela/Nariz) */}
            <MappingLine x1="0" y1="-350" x2="0" y2="380" opacity="0.8" />

            {/* 2. Diagonais da Asa do Nariz (Mapeamento V) */}
            {/* Para as Caudas (Pontos 3) */}
            <MappingLine x1={originX} y1={originY} x2={l.tail.x} y2={l.tail.y} opacity="0.4" />
            <MappingLine x1={originX} y1={originY} x2={r.tail.x} y2={r.tail.y} opacity="0.4" />
            
            {/* Para os Pontos Iniciais (Pontos 1) */}
            <MappingLine x1={originX} y1={originY} x2={l.topStart.x} y2={l.topStart.y} opacity="0.6" />
            <MappingLine x1={originX} y1={originY} x2={r.topStart.x} y2={r.topStart.y} opacity="0.6" />

            {/* Para os Arcos/Picos (Pontos 2) */}
            <MappingLine x1={originX} y1={originY} x2={l.topArch.x} y2={l.topArch.y} opacity="0.3" />
            <MappingLine x1={originX} y1={originY} x2={r.topArch.x} y2={r.topArch.y} opacity="0.3" />

            {/* 3. Linhas Verticais de Prumo (Início da Sobrancelha) */}
            <MappingLine x1={l.topStart.x} y1={l.topStart.y - 150} x2={l.topStart.x} y2={l.topStart.y + 150} />
            <MappingLine x1={r.topStart.x} y1={r.topStart.y - 150} x2={r.topStart.x} y2={r.topStart.y + 150} />

            {/* 4. O "X" Central de Simetria */}
            <MappingLine x1={l.topStart.x} y1={l.topStart.y} x2={r.topStart.x} y2={r.topStart.y - 100} opacity="0.4" />
            <MappingLine x1={r.topStart.x} y1={r.topStart.y} x2={l.topStart.x} y2={l.topStart.y - 100} opacity="0.4" />

            {/* 5. Triângulo do Nariz */}
            <MappingLine x1={originX} y1={originY} x2={originX - 40} y2={originY + 60} />
            <MappingLine x1={originX} y1={originY} x2={originX + 40} y2={originY + 60} />
            <MappingLine x1={originX - 40} y1={originY + 60} x2={originX + 40} y2={originY + 60} opacity="0.3" />

            {/* Marcadores de Interseção Estáticos conforme Referência */}
            <YellowDot x={0} y={l.topStart.y - 50} />
          </g>
        )}

        {/* Desenho do Molde (Sobrancelhas) */}
        <g fill="none">
          {['left', 'right'].map((side) => (
            <g key={side} opacity={opacity}>
              <path 
                d={createMappingPath(side as 'left' | 'right', side === 'left' ? leftOffset : rightOffset)} 
                stroke="#000" 
                strokeWidth="0.8"
                fill={color}
                fillOpacity="0.2"
                strokeLinejoin="miter"
              />
            </g>
          ))}
        </g>

        {/* 6 Pontos de Ajuste (Draggable Handles) - Amarelos e Destacados */}
        {showGuides && (
          <g>
            {['left', 'right'].map((side) => {
              const sSide = side as 'left' | 'right';
              const p = getPoints(sSide, sSide === 'left' ? leftOffset : rightOffset);
              const isActive = targetSide === 'both' || targetSide === sSide;
              const isType = (t: string) => activeHandle?.side === sSide && activeHandle?.type === t;
              
              // Tamanho dos pontos conforme solicitação (2-4px real, aqui escalado para o SVG)
              const dotR = (t: string) => isType(t) ? 8 : 4;

              return (
                <g key={sSide} opacity={isActive ? 1 : 0.3} style={{ pointerEvents: 'auto' }}>
                  {/* Ponto 1: Início (Head) */}
                  <circle cx={p.topStart.x} cy={p.topStart.y} r={dotR('pos')} fill="#ffff00" stroke="#000" strokeWidth="0.5" />
                  
                  {/* Ponto 2: Pico (Arch) */}
                  <circle cx={p.topArch.x} cy={p.topArch.y} r={dotR('arch')} fill="#ffff00" stroke="#000" strokeWidth="0.5" />
                  
                  {/* Ponto 3: Final (Tail) */}
                  <circle cx={p.tail.x} cy={p.tail.y} r={dotR('width')} fill="#ffff00" stroke="#000" strokeWidth="0.5" />
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