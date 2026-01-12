
import React, { useState, useRef, useEffect } from 'react';
import CameraView, { CameraViewHandle } from './components/CameraView';
import EyebrowOverlay from './components/EyebrowOverlay';
import SidebarControls from './components/SidebarControls';
import { INITIAL_BROW_CONFIG } from './constants';
import { BrowConfig, ControlMode, ActiveHandle } from './types';

const STORAGE_KEY = 'brow_map_pro_v3_config';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<ActiveHandle | null>(null);
  
  const cameraRef = useRef<CameraViewHandle>(null);

  // Detecta se a permissão já foi concedida anteriormente para pular a tela de introdução
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as any });
          if (result.state === 'granted') {
            setHasPermission(true);
          }
          result.onchange = () => {
            if (result.state === 'granted') setHasPermission(true);
            else if (result.state === 'denied') setHasPermission(false);
          };
        }
      } catch (e) {
        console.debug("Permissions API não disponível ou erro na consulta.");
      }
    };
    checkPermission();
  }, []);

  const requestCameraPermission = async () => {
    setIsInitializing(true);
    try {
      // Solicitação direta de mídia - gatilho essencial para browsers móveis (Gesture required)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Paramos os tracks apenas para sinalizar permissão; o CameraView re-abrirá com as specs corretas
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err: any) {
      console.error("Permissão negada ou erro:", err);
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const captureSnapshot = async () => {
    const video = cameraRef.current?.getVideoElement();
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (config.mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (config.mirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `browmap-pro-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      URL.revokeObjectURL(url);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };
    img.src = url;
  };

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (clientX > window.innerWidth - (isSidebarOpen ? 320 : 0)) return;
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  };

  const onMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    if (config.targetSide === 'both') {
      setConfig(prev => ({ ...prev, posX: prev.posX + dx, posY: prev.posY + dy }));
    } else {
      const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
      setConfig(prev => ({ ...prev, [sideKey]: { ...prev[sideKey], x: prev[sideKey].x + dx, y: prev[sideKey].y + dy } }));
    }
    lastPos.current = { x: clientX, y: clientY };
  };

  // Tela de boas-vindas para Android que solicita a permissão da câmera
  if (hasPermission !== true) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        {/* Glow de fundo inspirado no Material 3 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="mb-10 p-10 bg-zinc-900/40 backdrop-blur-2xl rounded-[3.5rem] border border-white/10 shadow-2xl relative group">
            <div className="absolute inset-0 bg-amber-500/5 rounded-[3.5rem] opacity-0 group-active:opacity-100 transition-opacity"></div>
            <svg className={`w-16 h-16 text-amber-500 ${isInitializing ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          
          <h1 className="text-white font-black text-4xl italic tracking-tighter mb-4 uppercase">
            BrowMap <span className="text-amber-500">Pro</span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium mb-12 px-6 leading-relaxed max-w-[320px]">
            Sua ferramenta profissional de visagismo. Para iniciar a análise facial em tempo real, habilite a câmera.
          </p>

          <button 
            onClick={requestCameraPermission} 
            disabled={isInitializing}
            className="w-full py-6 bg-amber-500 text-black text-xs font-black uppercase rounded-[2.5rem] shadow-[0_25px_50px_rgba(245,158,11,0.2)] active:scale-95 active:bg-amber-400 transition-all disabled:opacity-50"
          >
            {isInitializing ? 'Sincronizando Sensor...' : 'Iniciar Espelhamento'}
          </button>

          {hasPermission === false && (
            <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] animate-in fade-in slide-in-from-bottom-2">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-normal">
                Acesso bloqueado pelo sistema.<br/>Habilite a câmera nas configurações do Android.
              </p>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-12 left-0 right-0 text-center opacity-40">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Design de Precisão • 2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black font-sans text-zinc-100 select-none">
      <div 
        className={`relative flex-1 transition-all duration-500 bg-transparent h-full overflow-hidden ${isSidebarOpen && window.innerWidth > 1024 ? 'mr-[320px]' : ''}`}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={() => isDragging.current = false}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={() => isDragging.current = false}
      >
        <CameraView ref={cameraRef} deviceId={selectedCamera} mirror={config.mirror} />
        <EyebrowOverlay config={config} activeHandle={draggingHandle} />

        <div className="absolute top-10 left-10 z-30 pointer-events-none">
          <span className="text-amber-500 font-black text-xl italic tracking-tighter drop-shadow-2xl">BrowMap Pro</span>
          <div className="flex gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-300">Live Analyzer</span>
            </div>
          </div>
        </div>

        {(!isSidebarOpen || window.innerWidth <= 1024) && (
          <button 
            onClick={() => {
              setIsSidebarOpen(true);
              if (navigator.vibrate) navigator.vibrate(5);
            }} 
            className="absolute top-10 right-10 w-14 h-14 bg-amber-500 text-black rounded-2xl shadow-2xl z-30 flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        )}
      </div>

      <div className={`fixed right-0 top-0 bottom-0 z-50 transition-all duration-500 ease-out h-full ${isSidebarOpen ? 'w-[320px] translate-x-0' : 'w-0 translate-x-full'}`}>
        <SidebarControls 
          config={config} 
          setConfig={setConfig} 
          activeMode={activeMode} 
          setActiveMode={setActiveMode} 
          resetConfig={() => {
            setConfig(INITIAL_BROW_CONFIG);
            if (navigator.vibrate) navigator.vibrate(15);
          }} 
          onSave={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(config))}
          onSnapshot={captureSnapshot}
          selectedCamera={selectedCamera} 
          setSelectedCamera={setSelectedCamera} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>
    </div>
  );
};

export default App;
