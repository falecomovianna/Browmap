
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Função para solicitar permissão explicitamente
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Se chegamos aqui, temos permissão. Paramos o stream inicial para o CameraView assumir.
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error("Permissão negada:", err);
      setHasPermission(false);
    }
  };

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

  // Tela de Permissão
  if (hasPermission !== true) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20">
          <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-amber-500 font-black text-2xl italic tracking-tighter mb-4">BROW MAP PRO</h1>
        <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold mb-10 max-w-xs leading-relaxed">
          Para iniciar o mapeamento digital, precisamos acessar sua câmera.
        </p>
        
        <button 
          onClick={requestCameraPermission}
          className="w-full max-w-xs py-5 bg-amber-500 text-black text-xs font-black uppercase rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.3)] active:scale-95 transition-all mb-4"
        >
          {hasPermission === false ? "Tentar Novamente" : "Permitir Câmera"}
        </button>
        
        {hasPermission === false && (
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
            Acesso à câmera é obrigatório
          </p>
        )}
        
        <p className="absolute bottom-12 text-[9px] text-zinc-600 uppercase tracking-[0.4em]">
          Professional Visagism Tools
        </p>
      </div>
    );
  }

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

        {/* Nome do Aplicativo no Canto Superior Esquerdo */}
        <div className="absolute top-8 left-8 z-30 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-amber-500 font-black text-sm italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BrowMap Pro
            </span>
            <span className="text-[7px] text-white font-bold uppercase tracking-[0.3em] opacity-80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Digital Visagism
            </span>
          </div>
        </div>

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
