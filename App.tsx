
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from './components/CameraView';
import EyebrowOverlay from './components/EyebrowOverlay';
import SidebarControls from './components/SidebarControls';
import { INITIAL_BROW_CONFIG } from './constants';
import { BrowConfig, ControlMode } from './types';

const STORAGE_KEY = 'brow_map_pro_v2_config';

const App: React.FC = () => {
  const [config, setConfig] = useState<BrowConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_BROW_CONFIG;
      }
    }
    return INITIAL_BROW_CONFIG;
  });

  const [activeMode, setActiveMode] = useState<ControlMode>('visagism');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleUnload = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [config]);

  const saveConfigManually = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const initialDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const initialAngle = useRef<number | null>(null);
  const initialRotation = useRef<number>(0);

  const resetConfig = useCallback(() => {
    if (confirm("Deseja redefinir todas as marcações para o padrão profissional?")) {
      setConfig(INITIAL_BROW_CONFIG);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const getAngle = (t1: React.Touch, t2: React.Touch) => {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSidebarOpen && e.touches[0].clientX > window.innerWidth - 320) return;

    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      initialDist.current = getDistance(e.touches[0], e.touches[1]);
      
      if (config.targetSide === 'both') {
        initialScale.current = config.scale;
        initialRotation.current = config.rotation;
      } else {
        const sideOff = config.targetSide === 'left' ? config.leftOffset : config.rightOffset;
        initialScale.current = sideOff.scale;
        initialRotation.current = sideOff.rotation;
      }
      
      initialAngle.current = getAngle(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      
      if (config.targetSide === 'both') {
        setConfig(prev => ({
          ...prev,
          posX: prev.posX + dx,
          posY: prev.posY + dy
        }));
      } else {
        const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
        setConfig(prev => ({
          ...prev,
          [sideKey]: { 
            ...prev[sideKey], 
            x: prev[sideKey].x + dx,
            y: prev[sideKey].y + dy 
          }
        }));
      }
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialDist.current !== null && initialAngle.current !== null) {
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDist / initialDist.current;
      const newScale = Math.min(Math.max(initialScale.current * scaleFactor, 0.2), 5.0);

      const currentAngle = getAngle(e.touches[0], e.touches[1]);
      const angleDiff = currentAngle - initialAngle.current;
      const newRotation = initialRotation.current + angleDiff;

      if (config.targetSide === 'both') {
        setConfig(prev => ({ ...prev, scale: newScale, rotation: newRotation }));
      } else {
        const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
        setConfig(prev => ({
          ...prev,
          [sideKey]: { ...prev[sideKey], scale: newScale, rotation: newRotation }
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    initialDist.current = null;
    initialAngle.current = null;
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black font-sans text-zinc-100 select-none">
      <div 
        className="absolute inset-0 bg-zinc-950 cursor-move h-full overflow-hidden" 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEnd}
      >
        <CameraView deviceId={selectedCamera} mirror={config.mirror} />
        <EyebrowOverlay config={config} />

        {/* HUD de status inferior */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
             <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-[11px] font-black text-white uppercase tracking-widest whitespace-nowrap drop-shadow-md">
               {config.targetSide === 'both' ? 'Sincronia Global' : config.targetSide === 'left' ? 'Ajuste: Esquerda' : 'Ajuste: Direita'}
             </span>
          </div>
        </div>

        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="absolute top-8 right-8 p-5 bg-amber-500 text-black rounded-3xl shadow-[0_10px_40px_rgba(245,158,11,0.4)] active:scale-90 z-30 transition-transform"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-transparent z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Painel Lateral - TOTALMENTE TRANSPARENTE (apenas os botões aparecerão) */}
      <div className={`fixed right-0 top-0 bottom-0 z-50 transition-all duration-500 ease-out h-full ${isSidebarOpen ? 'w-[320px] translate-x-0' : 'w-0 translate-x-full'} overflow-hidden bg-transparent`}>
        <SidebarControls 
          config={config} 
          setConfig={setConfig} 
          activeMode={activeMode} 
          setActiveMode={setActiveMode} 
          resetConfig={resetConfig} 
          onSave={saveConfigManually}
          selectedCamera={selectedCamera} 
          setSelectedCamera={setSelectedCamera} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>
    </div>
  );
};

export default App;
