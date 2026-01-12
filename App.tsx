
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from './components/CameraView';
import EyebrowOverlay from './components/EyebrowOverlay';
import SidebarControls from './components/SidebarControls';
import { INITIAL_BROW_CONFIG } from './constants';
import { BrowConfig, ControlMode } from './types';

const STORAGE_KEY = 'brow_map_pro_config';

const App: React.FC = () => {
  // Inicializa o estado tentando carregar do localStorage
  const [config, setConfig] = useState<BrowConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar configurações salvas:", e);
        return INITIAL_BROW_CONFIG;
      }
    }
    return INITIAL_BROW_CONFIG;
  });

  const [activeMode, setActiveMode] = useState<ControlMode>('visagism');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Salva automaticamente no localStorage sempre que houver mudanças críticas (opcional, mas profissional)
  // O usuário pediu especificamente um botão, mas manteremos o auto-save para garantir que não se perca nada.
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
    if (confirm("Deseja redefinir todas as marcações para o padrão de fábrica?")) {
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
          posX: prev.posX + (prev.mirror ? -dx : dx),
          posY: prev.posY + dy
        }));
      } else {
        const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
        setConfig(prev => ({
          ...prev,
          [sideKey]: { 
            ...prev[sideKey], 
            x: prev[sideKey].x + (prev.mirror ? -dx : dx),
            y: prev[sideKey].y + dy 
          }
        }));
      }
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialDist.current !== null && initialAngle.current !== null) {
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDist / initialDist.current;
      const newScale = Math.min(Math.max(initialScale.current * scaleFactor, 0.4), 3.5);

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
      {!isLandscape && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center md:hidden">
          <div className="w-24 h-24 mb-6 border-4 border-amber-500 rounded-2xl flex items-center justify-center animate-rotate">
            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-amber-500 mb-2">MODO HORIZONTAL</h2>
          <button onClick={() => setIsLandscape(true)} className="mt-8 px-6 py-3 bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300">Continuar</button>
        </div>
      )}

      <div className="absolute inset-0 bg-zinc-950 cursor-move h-full overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <CameraView deviceId={selectedCamera} mirror={config.mirror} />
        <EyebrowOverlay config={config} />

        <div className="absolute bottom-6 left-6 pointer-events-none opacity-50 drop-shadow-lg">
          <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">
               {config.targetSide === 'both' ? 'Sincronia Ativa' : config.targetSide === 'left' ? 'Ajustando Esquerda' : 'Ajustando Direita'}
             </span>
          </div>
        </div>

        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 right-6 p-4 bg-amber-500/90 backdrop-blur-md text-black rounded-2xl shadow-2xl active:scale-95 z-10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}
      </div>

      <div className={`fixed right-0 top-0 bottom-0 z-20 transition-all duration-300 h-full ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} overflow-hidden bg-transparent`}>
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
