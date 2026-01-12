
import React, { useEffect, useState } from 'react';
import { BrowConfig, ControlMode } from '../types';
import { COLORS } from '../constants';

interface SidebarControlsProps {
  config: BrowConfig;
  setConfig: React.Dispatch<React.SetStateAction<BrowConfig>>;
  activeMode: ControlMode;
  setActiveMode: (mode: ControlMode) => void;
  resetConfig: () => void;
  onSave: () => void;
  selectedCamera: string | null;
  setSelectedCamera: (id: string) => void;
  onClose?: () => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({ 
  config, setConfig, activeMode, setActiveMode, resetConfig, onSave,
  selectedCamera, setSelectedCamera, onClose
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [saveFeedback, setSaveFeedback] = useState(false);
  
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.error("Erro ao listar dispositivos", err);
      }
    };
    getDevices();
  }, [selectedCamera]);

  const handleSave = () => {
    onSave();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const updateConfig = (key: keyof BrowConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getOffsetKey = (key: string): string | null => {
    const map: Record<string, string> = {
      'posX': 'x',
      'posY': 'y',
      'scale': 'scale',
      'rotation': 'rotation',
      'width': 'width',
      'archHeight': 'archHeight',
      'thickness': 'thickness',
      'curvature': 'curvature'
    };
    return map[key] || null;
  };

  const updateValue = (key: string, val: number) => {
    if (config.targetSide === 'both') {
      updateConfig(key as keyof BrowConfig, val);
      const offsetKey = getOffsetKey(key);
      if (offsetKey) {
        setConfig(prev => ({
          ...prev,
          leftOffset: { ...prev.leftOffset, [offsetKey]: key === 'posX' || key === 'posY' ? 0 : val },
          rightOffset: { ...prev.rightOffset, [offsetKey]: key === 'posX' || key === 'posY' ? 0 : val }
        }));
      }
    } else {
      const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
      const offsetKey = getOffsetKey(key);
      
      if (offsetKey) {
        setConfig(prev => ({
          ...prev,
          [sideKey]: { ...prev[sideKey], [offsetKey]: val }
        }));
      } else {
        updateConfig(key as keyof BrowConfig, val);
      }
    }
  };

  const getDisplayValue = (key: string) => {
    if (config.targetSide === 'both') return (config as any)[key];
    const off = config.targetSide === 'left' ? config.leftOffset : config.rightOffset;
    const offsetKey = getOffsetKey(key);
    if (offsetKey && (off as any)[offsetKey] !== undefined) {
      return (off as any)[offsetKey];
    }
    return (config as any)[key];
  };

  const SideSelector = () => (
    <div className="flex gap-1.5 mb-6 drop-shadow-xl">
      {[
        { id: 'left', label: 'ESQUERDA' },
        { id: 'both', label: 'AMBAS (SIM)' },
        { id: 'right', label: 'DIREITA' }
      ].map(side => (
        <button
          key={side.id}
          onClick={() => updateConfig('targetSide', side.id)}
          className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all border shadow-md ${
            config.targetSide === side.id 
            ? 'bg-amber-500 text-black border-amber-400' 
            : 'bg-black/40 text-white/60 border-white/10 backdrop-blur-sm'
          }`}
        >
          {side.label}
        </button>
      ))}
    </div>
  );

  const Slider = ({ label, value, min, max, step, onChange, className = "" }: any) => (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between items-center mb-1 px-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        <label className="text-[10px] font-black uppercase tracking-widest text-white">{label}</label>
        <span className="text-[11px] font-mono text-amber-400 font-bold">{typeof value === 'number' ? value.toFixed(1) : value}</span>
      </div>
      <div className="relative flex items-center h-6">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-black/50 border border-white/20 rounded-full appearance-none cursor-pointer accent-amber-500"
        />
      </div>
    </div>
  );

  return (
    <div className="w-80 h-full flex flex-col p-6 overflow-y-auto scrollbar-hide pointer-events-auto">
      <div className="flex items-center justify-between mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col">
          <h1 className="text-amber-500 font-black text-xl leading-none italic tracking-tighter">BROW MAP</h1>
          <p className="text-[9px] text-white/90 font-bold uppercase tracking-[0.3em] mt-1">Professional Pro</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => updateConfig('mirror', !config.mirror)}
            className={`p-2.5 rounded-2xl transition-all shadow-2xl ${config.mirror ? 'bg-amber-500 text-black' : 'bg-black/40 text-white border border-white/20'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button onClick={onClose} className="p-2.5 bg-black/40 text-white rounded-2xl border border-white/20 shadow-2xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {(['visagism', 'position', 'shape', 'style', 'camera'] as ControlMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border shadow-lg ${
              activeMode === mode ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/40 text-white border-white/10'
            }`}
          >
            {mode === 'visagism' ? 'Grid' : mode === 'position' ? 'Pos' : mode === 'shape' ? 'Molde' : mode === 'style' ? 'Cor' : 'Cam'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4">
        {(activeMode === 'position' || activeMode === 'shape') && <SideSelector />}

        {activeMode === 'visagism' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between px-1 drop-shadow-lg">
                <span className="text-[11px] text-white font-black uppercase tracking-wider">Mapeamento Técnico</span>
                <button onClick={() => updateConfig('showVisagismGrid', !config.showVisagismGrid)} className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${config.showVisagismGrid ? 'bg-amber-500' : 'bg-black/60 border border-white/30'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.showVisagismGrid ? 'right-1' : 'left-1'}`} />
                </button>
             </div>
             <div className="flex items-center justify-between px-1 drop-shadow-lg">
                <span className="text-[11px] text-white font-black uppercase tracking-wider">Pontos Guia</span>
                <button onClick={() => updateConfig('showGuides', !config.showGuides)} className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${config.showGuides ? 'bg-amber-500' : 'bg-black/60 border border-white/30'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.showGuides ? 'right-1' : 'left-1'}`} />
                </button>
             </div>
             <Slider label="Tamanho Handles" value={config.handleSize} min={2} max={12} step={0.5} onChange={(v: number) => updateConfig('handleSize', v)} />
          </div>
        )}

        {activeMode === 'position' && (
          <div className="space-y-1">
            <Slider label="Eixo Vertical" value={getDisplayValue('posY')} min={-300} max={300} step={1} onChange={(v: number) => updateValue('posY', v)} />
            <Slider label="Eixo Horizontal" value={getDisplayValue('posX')} min={-300} max={300} step={1} onChange={(v: number) => updateValue('posX', v)} />
            <Slider label="Escala / Zoom" value={getDisplayValue('scale')} min={0.4} max={2.5} step={0.01} onChange={(v: number) => updateValue('scale', v)} />
            <Slider label="Rotação / Inclina" value={getDisplayValue('rotation')} min={-30} max={30} step={0.5} onChange={(v: number) => updateValue('rotation', v)} />
            {config.targetSide === 'both' && <Slider label="Distância Central" value={config.spacing} min={10} max={120} step={1} onChange={(v: number) => updateConfig('spacing', v)} />}
          </div>
        )}

        {activeMode === 'shape' && (
          <div className="space-y-1">
            <Slider label="Comprimento" value={getDisplayValue('width')} min={60} max={200} step={1} onChange={(v: number) => updateValue('width', v)} />
            <Slider label="Altura do Arco" value={getDisplayValue('archHeight')} min={5} max={60} step={1} onChange={(v: number) => updateValue('archHeight', v)} />
            <Slider label="Espessura Linha" value={getDisplayValue('thickness')} min={4} max={25} step={0.5} onChange={(v: number) => updateValue('thickness', v)} />
            <Slider label="Arredondamento" value={getDisplayValue('curvature')} min={0} max={1.5} step={0.05} onChange={(v: number) => updateValue('curvature', v)} />
          </div>
        )}

        {activeMode === 'style' && (
          <div className="space-y-8">
            <Slider label="Visibilidade" value={config.opacity} min={0.1} max={1} step={0.05} onChange={(v: number) => updateConfig('opacity', v)} />
            <div className="px-1">
              <label className="text-[10px] font-black uppercase text-white block mb-4 tracking-widest drop-shadow-lg">Cor de Marcação</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map(c => (
                  <button key={c} onClick={() => updateConfig('color', c)} className={`w-9 h-9 rounded-full border-2 transition-all shadow-xl ${config.color === c ? 'border-white scale-125 shadow-amber-500/40' : 'border-white/40'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMode === 'camera' && (
          <div className="space-y-2.5">
            {devices.map((device, idx) => (
              <button key={device.deviceId} onClick={() => setSelectedCamera(device.deviceId)} className={`w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase border transition-all shadow-xl ${selectedCamera === device.deviceId ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/50 border-white/20 text-white'}`}>
                {device.label || `Lente Digital ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <button 
          onClick={handleSave} 
          className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${saveFeedback ? 'bg-green-600 border-green-400 text-white' : 'bg-amber-500 text-black border-amber-400'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {saveFeedback ? 'SALVO COM SUCESSO' : 'SALVAR CONFIGURAÇÃO'}
        </button>

        <button onClick={resetConfig} className="w-full py-4 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-red-500 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Redefinir Tudo
        </button>
      </div>
    </div>
  );
};

export default SidebarControls;
