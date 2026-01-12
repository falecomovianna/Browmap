
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

export interface CameraViewHandle {
  getVideoElement: () => HTMLVideoElement | null;
}

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(({ deviceId, mirror }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isInitializing = useRef(false);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current
  }));

  const stopTracks = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (retryWithAny = false) => {
    if (isInitializing.current && !retryWithAny) return;
    isInitializing.current = true;
    setError(null);
    setLoading(true);

    try {
      stopTracks();
      // Delay tático para liberar o barramento do sensor
      await new Promise(resolve => setTimeout(resolve, 400));

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: deviceId ? undefined : "user",
        deviceId: deviceId ? { exact: deviceId } : undefined
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
      
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setLoading(false);
          } catch (e) {
            console.error("Autoplay bloqueado:", e);
            // Tentativa de play forçado caso o browser bloqueie
            setLoading(false);
          }
        };
      }
    } catch (err: any) {
      console.error("Erro no sensor de imagem:", err);
      if (!retryWithAny) {
        // Fallback genérico para qualquer câmera disponível
        startCamera(true);
        return;
      }
      setError("Hardware óptico não responde. Verifique as permissões do sistema Android.");
      setLoading(false);
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopTracks();
  }, [deviceId]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-all duration-1000 ${mirror ? 'scale-x-[-1]' : 'scale-x-1'} ${loading ? 'blur-3xl opacity-0 scale-110' : 'blur-0 opacity-100 scale-100'}`}
        style={{ zIndex: 0, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />
      
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
             </div>
          </div>
          <p className="mt-6 text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] animate-pulse">Calibrando Sensor...</p>
        </div>
      )}

      {error && (
        <div className="relative z-[300] p-10 bg-zinc-900/95 backdrop-blur-2xl rounded-[3rem] border border-red-500/20 text-center max-w-xs shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white text-base font-black mb-2 uppercase">Falha Óptica</p>
          <p className="text-zinc-500 text-[11px] mb-10 leading-relaxed font-medium">{error}</p>
          <button onClick={() => startCamera()} className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-[1.5rem] shadow-xl active:scale-95 transition-all">
            Reiniciar Hardware
          </button>
        </div>
      )}
    </div>
  );
});

export default CameraView;
