
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
    if (navigator.vibrate) navigator.vibrate(50);
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
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-1.5 px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">
          {label}
        </label>
        <span className="text-[10px] font-mono text-amber-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5 shadow-inner">
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => {
          onChange(parseFloat(e.target.value));
          if (navigator.vibrate) navigator.vibrate(1);
        }}
        className="w-full appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto scrollbar-hide select-none bg-black/80 backdrop-blur-3xl border-l border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-amber-500 font-black text-2xl italic tracking-tighter leading-none">BROW MAP PRO</h1>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-1">Visagismo Digital Profissional</p>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
        {(['visagism', 'position', 'shape', 'style', 'camera'] as ControlMode[]).map(mode => (
          <button
            key={mode} onClick={() => {
              setActiveMode(mode);
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase whitespace-nowrap transition-all flex-shrink-0 border ${
              activeMode === mode 
                ? 'bg-amber-500 text-black border-amber-400 shadow-xl shadow-amber-500/10 scale-105' 
                : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
            }`}
          >
            {mode === 'visagism' ? 'Simetria' : mode === 'position' ? 'Posição' : mode === 'shape' ? 'Molde' : mode === 'style' ? 'Aparência' : 'Câmera'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2">
        {(activeMode === 'position' || activeMode === 'shape') && (
          <div className="flex p-1.5 bg-white/5 rounded-[22px] mb-8 border border-white/5">
            {['left', 'both', 'right'].map(side => (
              <button
                key={side} onClick={() => {
                  setConfig(p => ({ ...p, targetSide: side as any }));
                  if (navigator.vibrate) navigator.vibrate(5);
                }}
                className={`flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase transition-all ${
                  config.targetSide === side ? 'bg-amber-500 text-black shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {side === 'both' ? '∞ Ambas' : side === 'left' ? 'L Esq' : 'R Dir'}
              </button>
            ))}
          </div>
        )}

        {activeMode === 'visagism' && (
          <div className="space-y-6">
            <div className="p-5 bg-white/5 rounded-[32px] space-y-5 border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-zinc-100 font-bold uppercase tracking-wider">Grade Mestra</span>
                  <span className="text-[8px] text-zinc-500 font-medium">Linhas de simetria facial</span>
                </div>
                <button onClick={() => setConfig(p => ({ ...p, showVisagismGrid: !p.showVisagismGrid }))} className={`w-14 h-7 rounded-full transition-all relative ${config.showVisagismGrid ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-zinc-800'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${config.showVisagismGrid ? 'left-8' : 'left-1'} shadow-md`} />
                </button>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-zinc-100 font-bold uppercase tracking-wider">Handles de Edição</span>
                  <span className="text-[8px] text-zinc-500 font-medium">Controle direto por toque</span>
                </div>
                <button onClick={() => setConfig(p => ({ ...p, showGuides: !p.showGuides }))} className={`w-14 h-7 rounded-full transition-all relative ${config.showGuides ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-zinc-800'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${config.showGuides ? 'left-8' : 'left-1'} shadow-md`} />
                </button>
              </div>
            </div>
            <Slider label="Tamanho das Âncoras" value={config.handleSize} min={2} max={16} step={0.5} onChange={(v: number) => updateValue('handleSize', v)} />
          </div>
        )}

        {activeMode === 'position' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Slider label="Eixo Vertical (Y)" value={getDisplayValue('posY')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posY', v)} />
            <Slider label="Eixo Horizontal (X)" value={getDisplayValue('posX')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posX', v)} />
            <Slider label="Escala Geral" value={getDisplayValue('scale')} min={0.2} max={4.0} step={0.01} precision={2} onChange={(v: number) => updateValue('scale', v)} />
            <Slider label="Inclinação Angular" value={getDisplayValue('rotation')} min={-90} max={90} step={0.5} onChange={(v: number) => updateValue('rotation', v)} />
          </div>
        )}

        {activeMode === 'shape' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Slider label="Comprimento (Ponto Cauda)" value={getDisplayValue('width')} min={30} max={350} step={1} onChange={(v: number) => updateValue('width', v)} />
            <Slider label="Altura do Ponto Alto" value={getDisplayValue('archHeight')} min={0} max={120} step={1} onChange={(v: number) => updateValue('archHeight', v)} />
            <Slider label="Ajuste do Arco Inferior" value={getDisplayValue('bottomArch')} min={-40} max={80} step={1} onChange={(v: number) => updateValue('bottomArch', v)} />
            <Slider label="Espessura do Ponto Inicial" value={getDisplayValue('thickness')} min={1} max={50} step={0.5} onChange={(v: number) => updateValue('thickness', v)} />
          </div>
        )}

        {activeMode === 'style' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <Slider label="Nível de Opacidade" value={config.opacity} min={0.05} max={1} step={0.05} precision={2} onChange={(v: number) => setConfig(p => ({ ...p, opacity: v }))} />
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 block mb-5 tracking-widest text-center">Tom da Marcação</label>
              <div className="grid grid-cols-6 gap-3">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setConfig(p => ({ ...p, color: c }))} className={`aspect-square rounded-xl border-4 transition-all shadow-xl ${config.color === c ? 'border-white scale-110 shadow-amber-500/20' : 'border-white/5'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button onClick={() => setConfig(p => ({ ...p, mirror: !p.mirror }))} className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase border transition-all flex items-center justify-center gap-3 ${config.mirror ? 'bg-amber-500 text-black border-transparent shadow-xl' : 'bg-white/5 text-zinc-300 border-white/10'}`}>
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              {config.mirror ? 'Modo Espelho Ativado' : 'Câmera Direta'}
            </button>
          </div>
        )}

        {activeMode === 'camera' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <label className="text-[10px] font-black uppercase text-zinc-500 block mb-2 tracking-widest">Sensores Detectados</label>
            {devices.map((device, idx) => (
              <button key={device.deviceId} onClick={() => setSelectedCamera(device.deviceId)} className={`w-full text-left p-6 rounded-[28px] text-[10px] font-black uppercase transition-all border ${selectedCamera === device.deviceId ? 'bg-amber-500 text-black border-transparent shadow-xl' : 'bg-white/5 border-white/5 text-zinc-400'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${selectedCamera === device.deviceId ? 'bg-black animate-pulse' : 'bg-zinc-700'}`} />
                  <span className="truncate">{device.label || `Módulo Óptico ${idx + 1}`}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 pb-safe">
        <button 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            alert("Symmetry Design Capturado!");
          }} 
          className="w-full py-5 bg-white text-black text-[11px] font-black uppercase rounded-3xl active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
          Capturar Snapshot
        </button>
        <button onClick={handleSave} className={`w-full py-5 text-[11px] font-black uppercase rounded-3xl transition-all shadow-xl ${saveStatus === 'saved' ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-amber-500 text-black active:scale-[0.98]'}`}>
          {saveStatus === 'saved' ? 'Design Salvo com Sucesso!' : 'Salvar Alterações'}
        </button>
        <button onClick={resetConfig} className="w-full py-3 text-zinc-600 hover:text-zinc-400 text-[10px] font-bold uppercase transition-colors">Redefinir Padrões</button>
      </div>
    </div>
  );
};

export default SidebarControls;
