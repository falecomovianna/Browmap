
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevs[videoDevs.length - 1].deviceId);
        }
      } catch (err) {
        console.error("Erro ao listar câmeras", err);
      }
    };
    getDevices();
  }, [selectedCamera]);

  const handleSave = () => {
    onSave();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateValue = (key: string, val: number) => {
    const offsetKeyMap: Record<string, string> = {
      'posX': 'x', 'posY': 'y', 'scale': 'scale', 'rotation': 'rotation',
      'width': 'width', 'archHeight': 'archHeight', 'bottomArch': 'bottomArch', 'thickness': 'thickness', 'curvature': 'curvature'
    };
    const offsetKey = offsetKeyMap[key];

    if (config.targetSide === 'both') {
      setConfig(prev => ({
        ...prev,
        [key]: val,
        leftOffset: offsetKey ? { ...prev.leftOffset, [offsetKey]: (key === 'posX' || key === 'posY') ? 0 : val } : prev.leftOffset,
        rightOffset: offsetKey ? { ...prev.rightOffset, [offsetKey]: (key === 'posX' || key === 'posY') ? 0 : val } : prev.rightOffset
      }));
    } else {
      const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
      if (offsetKey) {
        setConfig(prev => ({
          ...prev,
          [sideKey]: { ...prev[sideKey], [offsetKey]: val }
        }));
      } else {
        setConfig(prev => ({ ...prev, [key]: val }));
      }
    }
  };

  const getDisplayValue = (key: string) => {
    if (config.targetSide === 'both') return (config as any)[key];
    const off = config.targetSide === 'left' ? config.leftOffset : config.rightOffset;
    const offsetKeyMap: Record<string, string> = {
      'posX': 'x', 'posY': 'y', 'scale': 'scale', 'rotation': 'rotation',
      'width': 'width', 'archHeight': 'archHeight', 'bottomArch': 'bottomArch', 'thickness': 'thickness', 'curvature': 'curvature'
    };
    const offsetKey = offsetKeyMap[key];
    return offsetKey ? (off as any)[offsetKey] : (config as any)[key];
  };

  const Slider = ({ label, value, min, max, step, onChange, precision = 1 }: any) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{label}</label>
        <span className="text-[11px] font-mono text-amber-500 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/20 shadow-lg">
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-amber-500 border border-white/10"
      />
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto scrollbar-hide select-none bg-transparent">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h1 className="text-amber-500 font-black text-xl italic tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">BROW MAP PRO</h1>
          <p className="text-[9px] text-white font-bold uppercase tracking-[0.4em] mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]">Design Studio</p>
        </div>
        <button onClick={onClose} className="p-3 bg-black/50 text-white rounded-2xl border border-white/20 active:scale-90 transition-transform shadow-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1 mb-8">
        {(['visagism', 'position', 'shape', 'style', 'camera'] as ControlMode[]).map(mode => (
          <button
            key={mode} onClick={() => setActiveMode(mode)}
            className={`py-3.5 rounded-xl text-[8px] font-black uppercase border transition-all shadow-xl ${
              activeMode === mode ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-white/10'
            }`}
          >
            {mode === 'visagism' ? 'Grid' : mode === 'position' ? 'Pos' : mode === 'shape' ? 'Mold' : mode === 'style' ? 'Cor' : 'Cam'}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {(activeMode === 'position' || activeMode === 'shape') && (
          <div className="flex gap-1.5 mb-10">
            {['left', 'both', 'right'].map(side => (
              <button
                key={side} onClick={() => setConfig(p => ({ ...p, targetSide: side as any }))}
                className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase border transition-all shadow-xl ${
                  config.targetSide === side ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-white/10'
                }`}
              >
                {side === 'both' ? 'AMBAS' : side === 'left' ? 'ESQ' : 'DIR'}
              </button>
            ))}
          </div>
        )}

        {activeMode === 'visagism' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-black/60 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[11px] text-white font-black uppercase tracking-wider drop-shadow-md">Grade de Simetria</span>
              <button onClick={() => setConfig(p => ({ ...p, showVisagismGrid: !p.showVisagismGrid }))} className={`w-12 h-6 rounded-full relative transition-colors ${config.showVisagismGrid ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.showVisagismGrid ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/60 rounded-2xl border border-white/10 shadow-xl">
              <span className="text-[11px] text-white font-black uppercase tracking-wider drop-shadow-md">Pontos de Ajuste</span>
              <button onClick={() => setConfig(p => ({ ...p, showGuides: !p.showGuides }))} className={`w-12 h-6 rounded-full relative transition-colors ${config.showGuides ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${config.showGuides ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <Slider label="Tamanho dos Pontos" value={config.handleSize} min={2} max={16} step={0.5} onChange={(v: number) => updateValue('handleSize', v)} />
          </div>
        )}

        {activeMode === 'position' && (
          <div className="space-y-2">
            <Slider label="Eixo Vertical" value={getDisplayValue('posY')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posY', v)} />
            <Slider label="Eixo Horizontal" value={getDisplayValue('posX')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posX', v)} />
            <Slider label="Zoom / Escala" value={getDisplayValue('scale')} min={0.2} max={4.0} step={0.01} precision={2} onChange={(v: number) => updateValue('scale', v)} />
            <Slider label="Rotação" value={getDisplayValue('rotation')} min={-90} max={90} step={0.5} onChange={(v: number) => updateValue('rotation', v)} />
            {config.targetSide === 'both' && <Slider label="Distância Central" value={config.spacing} min={0} max={300} step={1} onChange={(v: number) => updateValue('spacing', v)} />}
          </div>
        )}

        {activeMode === 'shape' && (
          <div className="space-y-2">
            <Slider label="Comprimento" value={getDisplayValue('width')} min={30} max={350} step={1} onChange={(v: number) => updateValue('width', v)} />
            <Slider label="Arco Superior" value={getDisplayValue('archHeight')} min={0} max={120} step={1} onChange={(v: number) => updateValue('archHeight', v)} />
            <Slider label="Arco Inferior" value={getDisplayValue('bottomArch')} min={-40} max={80} step={1} onChange={(v: number) => updateValue('bottomArch', v)} />
            <Slider label="Espessura Inicial" value={getDisplayValue('thickness')} min={1} max={50} step={0.5} onChange={(v: number) => updateValue('thickness', v)} />
            <Slider label="Curvatura Superior" value={getDisplayValue('curvature')} min={0} max={3.0} step={0.05} precision={2} onChange={(v: number) => updateValue('curvature', v)} />
          </div>
        )}

        {activeMode === 'style' && (
          <div className="space-y-10">
            <Slider label="Opacidade do Molde" value={config.opacity} min={0.05} max={1} step={0.05} precision={2} onChange={(v: number) => setConfig(p => ({ ...p, opacity: v }))} />
            <div>
              <label className="text-[10px] font-black uppercase text-white block mb-5 tracking-[0.2em] drop-shadow-md">Cores da Marcação</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setConfig(p => ({ ...p, color: c }))} className={`w-11 h-11 rounded-full border-4 transition-all shadow-xl ${config.color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-black/40'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button onClick={() => setConfig(p => ({ ...p, mirror: !p.mirror }))} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase border flex items-center justify-center gap-4 transition-all shadow-xl ${config.mirror ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-white/10'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              {config.mirror ? 'MODO ESPELHO ATIVO' : 'MODO CÂMERA DIRETA'}
            </button>
          </div>
        )}

        {activeMode === 'camera' && (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-white block mb-2 tracking-[0.2em] drop-shadow-md">Selecione a Lente</label>
            {devices.map((device, idx) => (
              <button key={device.deviceId} onClick={() => setSelectedCamera(device.deviceId)} className={`w-full text-left p-5 rounded-2xl text-[10px] font-black uppercase border transition-all shadow-xl ${selectedCamera === device.deviceId ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 border-white/10 text-white'}`}>
                {device.label || `Lente Profissional ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3 pb-safe">
        <button onClick={handleSave} className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 ${saveStatus === 'saved' ? 'bg-green-600 text-white shadow-green-500/30' : 'bg-amber-500 text-black active:scale-95 shadow-amber-500/40'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          {saveStatus === 'saved' ? 'Ajustes Salvos!' : 'Salvar Configurações'}
        </button>
        <button onClick={resetConfig} className="w-full py-4 bg-black/60 text-white border border-white/10 text-[10px] font-black uppercase rounded-2xl active:scale-95 transition-all shadow-xl">Redefinir Tudo</button>
      </div>
    </div>
  );
};

export default SidebarControls;
