
import React, { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  deviceId: string | null;
  mirror: boolean;
}

/**
 * CameraView Component
 * Gerencia o ciclo de vida do fluxo de vídeo, permissões e tratamento de erros
 * específico para Web e WebViews Android.
 */
const CameraView: React.FC<CameraViewProps> = ({ deviceId, mirror }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorType, setErrorType] = useState<'permission' | 'https' | 'hardware' | 'browser' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  // Limpa os tracks da câmera para liberar o hardware
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

    // 1. Verificação de Contexto Seguro (Obrigatório para getUserMedia na Web)
    // A câmera só funciona em HTTPS ou localhost.
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocalhost) {
      setErrorType('https');
      setErrorMsg("ACESSO BLOQUEADO: A câmera requer uma conexão segura (HTTPS). Se estiver usando WebView no Android, certifique-se de que a URL de origem é segura ou use um servidor local para testes.");
      isStartingRef.current = false;
      return;
    }

    // 2. Verificação de suporte do Navegador/WebView
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType('browser');
      setErrorMsg("Navegador Incompatível: O ambiente atual não suporta a API de mídia (WebRTC). Se estiver no Android, verifique se o WebView está atualizado e se o JavaScript está habilitado.");
      isStartingRef.current = false;
      return;
    }

    try {
      stopTracks();

      // Configurações de constraints balanceadas para performance e qualidade
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { 
              facingMode: 'user', 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
        audio: false // Desabilitado para evitar pedidos de permissão de microfone desnecessários
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Tentativa com constraints ideais falhou, tentando modo básico...", e);
        // Fallback para qualquer hardware de vídeo disponível (útil em dispositivos Android com hardware customizado)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        activeStreamRef.current = stream;
        
        // No Android WebView, play() pode precisar de interação se as permissões de mídia não forem configuradas
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro no play automático:", playErr);
          // Tenta novamente sem silenciar se necessário, embora muted já esteja setado no JSX
        }
      }
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      
      // Diferenciação de erros para facilitar o diagnóstico do desenvolvedor
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('permission');
        setErrorMsg("PERMISSÃO NEGADA: O usuário ou o sistema bloqueou o acesso. No Android Studio, verifique se implementou o 'WebChromeClient.onPermissionRequest'.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('hardware');
        setErrorMsg("Hardware não encontrado: Nenhuma câmera detectada no dispositivo.");
      } else {
        setErrorType('hardware');
        setErrorMsg(`Erro de Sistema: ${err.message || "Não foi possível inicializar a câmera."}`);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopTracks();
  }, [deviceId]);

  // UI de Feedback de Erro
  if (errorType) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-white p-8 text-center z-20">
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-amber-500 mb-2">
              {errorType === 'https' ? 'Erro de Segurança' : errorType === 'permission' ? 'Erro de Permissão' : 'Erro de Acesso'}
            </h2>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium uppercase tracking-wider">{errorMsg}</p>
          </div>
          <button 
            onClick={() => startCamera()}
            className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            Tentar Novamente
          </button>

          {/* Dicas específicas para o desenvolvedor Android */}
          {(errorType === 'permission' || errorType === 'browser') && (
            <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 text-left overflow-hidden">
              <p className="text-[8px] text-zinc-500 font-bold uppercase mb-2">Checklist Android Studio:</p>
              <ul className="text-[8px] text-zinc-400 space-y-1 list-disc pl-3">
                <li>AndroidManifest.xml com CAMERA e hardware.camera</li>
                <li>Habilitar JavaScript: webView.settings.javaScriptEnabled = true</li>
                <li>Implementar WebChromeClient.onPermissionRequest</li>
              </ul>
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
