
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
  const [draggingHandle, setDraggingHandle] = useState<ActiveHandle | null>(null);
  
  const cameraRef = useRef<CameraViewHandle>(null);
  const overlayRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err: any) {
      setHasPermission(false);
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

    // 1. Desenha o vídeo (com espelhamento se necessário)
    if (config.mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (config.mirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 2. Converte SVG para imagem e desenha por cima
    const svgData = new XMLSerializer().serializeToString(document.querySelector('svg')!);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `browmap-snapshot-${Date.now()}.png`;
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

  if (hasPermission === false || hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-amber-500 font-black text-2xl italic mb-6">BROW MAP PRO</h1>
        <button onClick={requestCameraPermission} className="px-8 py-5 bg-amber-500 text-black text-[10px] font-black uppercase rounded-3xl shadow-2xl">
          Iniciar Câmera
        </button>
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
          <span className="text-amber-500 font-black text-base italic tracking-tighter drop-shadow-2xl">BrowMap Pro</span>
        </div>

        {(!isSidebarOpen || window.innerWidth <= 1024) && (
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="absolute top-10 right-10 p-5 bg-amber-500 text-black rounded-3xl shadow-2xl z-30"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        )}
      </div>

      <div className={`fixed right-0 top-0 bottom-0 z-50 transition-all duration-500 ease-out h-full ${isSidebarOpen ? 'w-[320px] translate-x-0' : 'w-0 translate-x-full'}`}>
        <SidebarControls 
          config={config} 
          setConfig={setConfig} 
          activeMode={activeMode} 
          setActiveMode={setActiveMode} 
          resetConfig={() => setConfig(INITIAL_BROW_CONFIG)} 
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
