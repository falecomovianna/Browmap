
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

    // 1. Draw Video
    if (config.mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (config.mirror) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 2. Draw SVG Overlay
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
      link.download = `browmap-android-pro-${Date.now()}.png`;
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
        <div className="w-24 h-24 mb-8 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
           <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
        </div>
        <h1 className="text-amber-500 font-black text-3xl italic mb-2 tracking-tighter">BROW MAP PRO</h1>
        <p className="text-zinc-500 text-xs mb-10 font-medium uppercase tracking-[0.2em]">Android Digital Visagism</p>
        <button onClick={requestCameraPermission} className="w-full max-w-xs py-5 bg-amber-500 text-black text-[11px] font-black uppercase rounded-[2rem] shadow-2xl active:scale-95 transition-transform">
          Permitir Câmera
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
          <span className="text-amber-500 font-black text-xl italic tracking-tighter drop-shadow-2xl">BrowMap Pro</span>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[8px] font-bold uppercase tracking-widest border border-white/10">1080p Reality</span>
            <span className="px-2 py-0.5 bg-amber-500/20 backdrop-blur-md rounded text-[8px] font-bold uppercase tracking-widest border border-amber-500/20 text-amber-500">Live Mirror</span>
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
