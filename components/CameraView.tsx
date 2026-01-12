
import React, { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ deviceId, mirror }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  const stopTracks = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador ou conexão (não-HTTPS) não suporta acesso à câmera.");
      }

      stopTracks();

      // Tentativa 1: Device específico (se houver) ou Câmera Frontal (padrão visagismo)
      let constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { ideal: deviceId } } : { facingMode: 'user' },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Tentativa 1 falhou, tentando fallback genérico...", e);
        // Tentativa 2: Fallback total (qualquer câmera disponível)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        activeStreamRef.current = stream;
        
        // Garante o play mesmo em políticas de economia de energia
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro ao dar play no vídeo:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Erro fatal na câmera:", err);
      setError(err.message || "Não foi possível iniciar o vídeo. Verifique se as permissões foram concedidas.");
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopTracks();
  }, [deviceId]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white p-8 text-center z-20">
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-amber-500 mb-2">Acesso Negado ou Falhou</h2>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium uppercase tracking-wider">{error}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => startCamera()}
              className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Tentar Novamente
            </button>
            <p className="text-[9px] text-zinc-500 uppercase mt-4">Certifique-se de usar HTTPS e permitir o uso da câmera quando solicitado.</p>
          </div>
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
      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${mirror ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
    />
  );
};

export default CameraView;
