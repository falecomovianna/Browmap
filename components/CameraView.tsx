
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
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isInitializing = useRef(false);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current
  }));

  const stopTracks = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
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

    try {
      stopTracks();
      await new Promise(resolve => setTimeout(resolve, 200));

      let videoConstraints: MediaTrackConstraints = {};
      if (retryWithAny) {
        videoConstraints = { facingMode: "user" };
      } else if (deviceId) {
        videoConstraints = { deviceId: { ideal: deviceId } };
      } else {
        videoConstraints = { facingMode: "user" };
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
          } catch (e) {
            console.error("Erro no play():", e);
          }
        };
      }
    } catch (err: any) {
      if (!retryWithAny) {
        startCamera(true);
        return;
      }
      setError("Câmera indisponível ou permissão negada.");
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopTracks;
  }, [deviceId]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-transform duration-700 ${mirror ? 'scale-x-[-1]' : 'scale-x-1'}`}
        style={{ zIndex: 0, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />
      {error && (
        <div className="relative z-50 p-6 bg-black/80 backdrop-blur-xl rounded-3xl border border-red-500/30 text-center max-w-xs shadow-2xl">
          <p className="text-red-400 text-sm font-bold mb-4">{error}</p>
          <button onClick={() => startCamera()} className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl">Recarregar</button>
        </div>
      )}
    </div>
  );
});

export default CameraView;
