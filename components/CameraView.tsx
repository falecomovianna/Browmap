
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
      // Pequeno delay para garantir que o hardware foi liberado
      await new Promise(resolve => setTimeout(resolve, 300));

      let videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      if (retryWithAny) {
        videoConstraints = { ...videoConstraints, facingMode: "user" };
      } else if (deviceId) {
        videoConstraints = { ...videoConstraints, deviceId: { exact: deviceId } };
      } else {
        videoConstraints = { ...videoConstraints, facingMode: "user" };
      }

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
            console.error("Erro no play():", e);
          }
        };
      }
    } catch (err: any) {
      console.error("Erro ao iniciar câmera:", err);
      if (!retryWithAny) {
        startCamera(true);
        return;
      }
      setError("Câmera não encontrada ou sem permissão.");
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
        className={`w-full h-full object-cover transition-all duration-1000 ${mirror ? 'scale-x-[-1]' : 'scale-x-1'} ${loading ? 'blur-2xl opacity-0' : 'blur-0 opacity-100'}`}
        style={{ zIndex: 0, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />
      
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 transition-opacity">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] text-amber-500 font-bold uppercase tracking-widest">Sincronizando Sensor...</p>
        </div>
      )}

      {error && (
        <div className="relative z-50 p-8 bg-zinc-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-red-500/20 text-center max-w-xs shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white text-sm font-bold mb-2">Erro de Hardware</p>
          <p className="text-zinc-500 text-xs mb-8">{error}</p>
          <button onClick={() => startCamera()} className="w-full py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all">
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
});

export default CameraView;
