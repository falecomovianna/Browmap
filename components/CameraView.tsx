
import React, { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ deviceId, mirror }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Para tracks antigos antes de começar novo stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // Tenta primeiro com o deviceId específico se fornecido
        let constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
          audio: false
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (innerErr) {
          console.warn("Falha ao abrir câmera com deviceId específico, tentando fallback...", innerErr);
          // Fallback: Tenta abrir qualquer câmera disponível (geralmente a frontal/padrão)
          constraints = { video: true, audio: false };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        console.error("Erro fatal ao acessar câmera:", err);
        setError("Erro ao acessar câmera: verifique se não há outro app usando a câmera ou as permissões do navegador.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md text-white p-6 text-center z-20">
        <div className="max-w-xs">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Erro de Hardware</p>
          <p className="text-xs text-zinc-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-full"
          >
            Recarregar App
          </button>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${mirror ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
    />
  );
};

export default CameraView;
