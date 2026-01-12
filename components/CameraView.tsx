
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
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
          audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        setError("Não foi possível acessar a câmera selecionada. Verifique as permissões do navegador.");
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
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white p-6 text-center">
        <div className="max-w-xs">
          <svg className="w-12 h-12 text-zinc-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium">{error}</p>
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
