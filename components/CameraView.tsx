
import React, { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ deviceId, mirror }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorType, setErrorType] = useState<'permission' | 'https' | 'hardware' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setErrorType(null);
    setErrorMsg(null);

    // Verificação de contexto seguro (Obrigatório para Câmera na Web)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setErrorType('https');
      setErrorMsg("A câmera requer uma conexão segura (HTTPS). No Android Studio, verifique se o WebView está carregando uma URL segura.");
      isStartingRef.current = false;
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("API de mídia não encontrada. No Android, habilite o suporte a WebRTC no WebView.");
      }

      stopTracks();

      // Configurações de Constraints (Ideal para Visagismo)
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Tentativa com constraints ideais falhou, tentando modo básico...", e);
        // Fallback para qualquer vídeo disponível (comum em WebViews limitados)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        activeStreamRef.current = stream;
        
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro no play automático:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('permission');
        setErrorMsg("Permissão negada. No Android Studio, certifique-se de sobrescrever 'onPermissionRequest' no seu WebChromeClient.");
      } else {
        setErrorType('hardware');
        setErrorMsg(err.message || "Erro de hardware ou câmera já em uso por outro app.");
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopTracks();
  }, [deviceId]);

  if (errorType) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white p-8 text-center z-20">
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {errorType === 'https' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-amber-500 mb-2">
              {errorType === 'https' ? 'Erro de Segurança' : errorType === 'permission' ? 'Permissão Necessária' : 'Falha na Câmera'}
            </h2>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium uppercase tracking-wider">{errorMsg}</p>
          </div>
          <button 
            onClick={() => startCamera()}
            className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            Tentar Novamente
          </button>
          {errorType === 'permission' && (
            <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 text-left">
              <p className="text-[8px] text-zinc-500 font-bold uppercase mb-2">Dica para Desenvolvedor Android:</p>
              <code className="text-[8px] text-amber-500/80 leading-tight">
                webView.webChromeClient = object : WebChromeClient() {'{'} <br/>
                &nbsp;&nbsp;override fun onPermissionRequest(request: PermissionRequest) {'{'} <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;request.grant(request.resources) <br/>
                &nbsp;&nbsp;{'}'} <br/>
                {'}'}
              </code>
            </div>
          )}
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
