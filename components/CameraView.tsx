
import React, { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ deviceId, mirror }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isInitializing = useRef(false);

  const stopTracks = () => {
    if (activeStreamRef.current) {
      console.log("[DEBUG] Encerrando tracks ativos para liberar hardware...");
      activeStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`[DEBUG] Track ${track.label} parado.`);
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
    console.log(`[DEBUG] Iniciando captura (Modo Fallback: ${retryWithAny})...`);

    // Validação de Contexto Seguro
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError("A câmera exige HTTPS.");
      isInitializing.current = false;
      return;
    }

    try {
      // 1. Limpeza total antes de tentar abrir
      stopTracks();
      
      // 2. Pequeno delay para o OS liberar o hardware (Essencial para Mobile)
      await new Promise(resolve => setTimeout(resolve, 150));

      // 3. Configuração de Constraints
      // Usamos 'ideal' em vez de 'exact' para evitar o erro 'Could not start video source'
      let videoConstraints: MediaTrackConstraints = {};
      
      if (retryWithAny) {
        videoConstraints = { facingMode: "user" };
      } else if (deviceId) {
        videoConstraints = { deviceId: { ideal: deviceId } };
      } else {
        videoConstraints = { facingMode: "user" };
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false
      };

      console.log("[DEBUG] Solicitando getUserMedia com:", JSON.stringify(constraints));
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[DEBUG] Stream obtido com sucesso:", stream.id);
      
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Garantia de Playback no Safari/Chrome Mobile
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log("[DEBUG] Metadados prontos. Tentando play...");
            await videoRef.current?.play();
            console.log("[DEBUG] Playback ativo. ReadyState:", videoRef.current?.readyState);
          } catch (e) {
            console.error("[DEBUG] Erro no play():", e);
          }
        };
      }
    } catch (err: any) {
      console.error("[DEBUG] Falha ao iniciar câmera:", err.name, err.message);
      
      // Se falhou com uma câmera específica, tenta qualquer uma
      if (!retryWithAny) {
        console.warn("[DEBUG] Tentando fallback para qualquer câmera disponível...");
        startCamera(true);
        return;
      }

      let userMsg = "Erro ao carregar câmera.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMsg = "Permissão negada pelo usuário.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMsg = "A câmera está sendo usada por outro app ou aba.";
      } else if (err.name === 'OverconstrainedError') {
        userMsg = "As configurações da câmera não são suportadas.";
      }
      
      setError(userMsg);
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
        className={`w-full h-full object-cover transition-transform duration-700 ${mirror ? 'scale-x-[-1]' : 'scale-x-1'}`}
        style={{ 
          display: error ? 'none' : 'block',
          zIndex: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh'
        }}
      />

      {error && (
        <div className="relative z-50 p-8 bg-black/90 backdrop-blur-xl rounded-[40px] border border-red-500/20 text-center max-w-xs mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-3">Erro de Hardware</h2>
          <p className="text-zinc-400 text-xs mb-8 leading-relaxed font-medium">{error}</p>
          <button 
            onClick={() => startCamera()}
            className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-2xl active:scale-95 transition-all shadow-xl"
          >
            Tentar Reconectar
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraView;
