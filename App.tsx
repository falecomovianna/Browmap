
import React, { useState, useCallback, useRef, useEffect } from 'react';
import CameraView from './components/CameraView';
import EyebrowOverlay from './components/EyebrowOverlay';
import SidebarControls from './components/SidebarControls';
import { INITIAL_BROW_CONFIG } from './constants';
import { BrowConfig, ControlMode, ActiveHandle } from './types';

const STORAGE_KEY = 'brow_map_pro_v2_config';

const App: React.FC = () => {
  const [config, setConfig] = useState<BrowConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_BROW_CONFIG; }
    }
    return INITIAL_BROW_CONFIG;
  });

  const [activeMode, setActiveMode] = useState<ControlMode>('visagism');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<ActiveHandle | null>(null);
  
  /**
   * Solicita permissão de câmera explicitamente.
   * Em WebViews Android, este gatilho ativa o onPermissionRequest do código nativo.
   */
  const requestCameraPermission = async () => {
    try {
      // Pequeno timeout para garantir que o contexto do navegador esteja pronto
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err: any) {
      console.error("Permissão de câmera falhou no App.tsx:", err);
      // Se for um erro de segurança/HTTPS, o CameraView lidará com a UI detalhada
      setHasPermission(false);
    }
  };

  // Tenta detectar permissão automaticamente no load para melhorar UX
  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      (navigator.permissions as any).query({ name: 'camera' }).then((status: any) => {
        if (status.state === 'granted') setHasPermission(true);
        status.onchange = () => {
          if (status.state === 'granted') setHasPermission(true);
        };
      }).catch(() => {});
    }
  }, []);

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const initialDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const initialAngle = useRef<number | null>(null);
  const initialRotation = useRef<number>(0);

  const findHitHandle = (clientX: number, clientY: number): ActiveHandle | null => {
    if (!config.showGuides) return null;
    
    const svgCenterX = window.innerWidth / 2 + config.posX;
    const svgCenterY = window.innerHeight / 2 + config.posY;
    const sides: ('left' | 'right')[] = ['left', 'right'];
    const threshold = 45; 

    for (const side of sides) {
      const off = side === 'left' ? config.leftOffset : config.rightOffset;
      const dir = side === 'left' ? -1 : 1;
      const sideStartX = svgCenterX + (side === 'left' ? -config.spacing/2 : config.spacing/2);
      
      const hPoints = [
        { type: 'pos', x: sideStartX + off.x, y: svgCenterY + off.y },
        { type: 'thickness', x: sideStartX + off.x, y: svgCenterY + off.y + off.thickness },
        { type: 'arch', x: sideStartX + off.x + (off.width * 0.62 * dir), y: svgCenterY + off.y - off.archHeight },
        { type: 'bottomArch', x: sideStartX + off.x + (off.width * 0.60 * dir), y: svgCenterY + off.y - off.archHeight + off.thickness + off.bottomArch },
        { type: 'width', x: sideStartX + off.x + (off.width * dir), y: svgCenterY + off.y + (off.archHeight * 0.4) },
      ];

      for (const hp of hPoints) {
        const dist = Math.hypot(hp.x - clientX, hp.y - clientY);
        if (dist < threshold) return { side, type: hp.type as any };
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSidebarOpen && e.touches[0].clientX > window.innerWidth - 320) return;

    const hit = findHitHandle(e.touches[0].clientX, e.touches[0].clientY);
    if (hit) {
      setDraggingHandle(hit);
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return;
    }

    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      initialDist.current = d;
      initialScale.current = config.targetSide === 'both' ? config.scale : (config.targetSide === 'left' ? config.leftOffset.scale : config.rightOffset.scale);
      initialAngle.current = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * 180 / Math.PI;
      initialRotation.current = config.targetSide === 'both' ? config.rotation : (config.targetSide === 'left' ? config.leftOffset.rotation : config.rightOffset.rotation);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;

    if (draggingHandle) {
      const { side, type } = draggingHandle;
      const sideKey = side === 'left' ? 'leftOffset' : 'rightOffset';
      const dir = side === 'left' ? -1 : 1;

      setConfig(prev => {
        const currentSide = prev[sideKey];
        const newSide = { ...currentSide };

        if (type === 'pos') {
          newSide.x += dx;
          newSide.y += dy;
        } else if (type === 'width') {
          newSide.width = Math.max(40, newSide.width + dx * dir);
        } else if (type === 'arch') {
          newSide.archHeight = Math.max(0, newSide.archHeight - dy);
        } else if (type === 'bottomArch') {
          newSide.bottomArch = Math.max(-30, newSide.bottomArch + dy);
        } else if (type === 'thickness') {
          newSide.thickness = Math.max(2, newSide.thickness + dy);
        }

        return { ...prev, [sideKey]: newSide };
      });
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return;
    }

    if (e.touches.length === 1 && isDragging.current) {
      if (config.targetSide === 'both') {
        setConfig(prev => ({ ...prev, posX: prev.posX + dx, posY: prev.posY + dy }));
      } else {
        const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
        setConfig(prev => ({
          ...prev,
          [sideKey]: { ...prev[sideKey], x: prev[sideKey].x + dx, y: prev[sideKey].y + dy }
        }));
      }
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && initialDist.current !== null) {
      const currentDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      const scaleFactor = currentDist / initialDist.current;
      const newScale = Math.min(Math.max(initialScale.current * scaleFactor, 0.2), 5.0);

      const currentAngle = Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * 180 / Math.PI;
      const angleDiff = currentAngle - (initialAngle.current || 0);
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
    setDraggingHandle(null);
    initialDist.current = null;
  };

  // Se a permissão for explicitamente negada ou ainda não solicitada, mostra tela de onboarding/permissão
  if (hasPermission === false || hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20">
          <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </div>
        <h1 className="text-amber-500 font-black text-2xl italic tracking-tighter mb-4">BROW MAP PRO</h1>
        <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold mb-10 max-w-xs leading-relaxed">
          {hasPermission === false ? "O acesso foi negado. Verifique as configurações de permissão do sistema ou do WebView." : "Acesse sua câmera para iniciar o visagismo digital."}
        </p>
        <button 
          onClick={requestCameraPermission} 
          className="w-full max-w-xs py-5 bg-amber-500 text-black text-xs font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          {hasPermission === false ? "Tentar Novamente" : "Permitir Câmera"}
        </button>
        {hasPermission === false && (
          <p className="mt-6 text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Dica: No Android, habilite a permissão de câmera nas configurações do App.</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black font-sans text-zinc-100 select-none">
      <div className="absolute inset-0 bg-zinc-950 cursor-move h-full overflow-hidden" 
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* O CameraView agora possui lógica de proteção HTTPS e fallback de hardware interna */}
        <CameraView deviceId={selectedCamera} mirror={config.mirror} />
        
        <EyebrowOverlay config={config} activeHandle={draggingHandle} />

        <div className="absolute top-8 left-8 z-30 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-amber-500 font-black text-sm italic tracking-tighter drop-shadow-md">BrowMap Pro</span>
            <span className="text-[7px] text-white font-bold uppercase tracking-[0.3em] opacity-80">Mapping Geometry</span>
          </div>
        </div>

        {!isSidebarOpen && (
          <div className="absolute left-8 bottom-10 flex flex-col gap-3 z-30">
            {['left', 'both', 'right'].map(s => (
              <button key={s} onClick={() => setConfig(p => ({ ...p, targetSide: s as any }))}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${config.targetSide === s ? 'bg-amber-500 border-amber-400 text-black scale-110 shadow-lg' : 'bg-black/40 border-white/20 text-white'}`}>
                <span className="text-[8px] font-black uppercase">{s === 'both' ? '∞' : s === 'left' ? 'L' : 'R'}</span>
              </button>
            ))}
          </div>
        )}

        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-8 right-8 p-5 bg-amber-500 text-black rounded-3xl shadow-xl active:scale-90 z-30 transition-transform">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        )}
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-transparent z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed right-0 top-0 bottom-0 z-50 transition-all duration-500 ease-out h-full ${isSidebarOpen ? 'w-[320px] translate-x-0' : 'w-0 translate-x-full'} overflow-hidden bg-transparent`}>
        <SidebarControls 
          config={config} 
          setConfig={setConfig} 
          activeMode={activeMode} 
          setActiveMode={setActiveMode} 
          resetConfig={() => setConfig(INITIAL_BROW_CONFIG)} 
          onSave={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(config))} 
          selectedCamera={selectedCamera} 
          setSelectedCamera={setSelectedCamera} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>
    </div>
  );
};

export default App;
