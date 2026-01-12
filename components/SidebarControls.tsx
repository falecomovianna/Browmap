
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
  onSnapshot: () => void;
  selectedCamera: string | null;
  setSelectedCamera: (id: string) => void;
  onClose?: () => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({ 
  config, setConfig, activeMode, setActiveMode, resetConfig, onSave, onSnapshot,
  selectedCamera, setSelectedCamera, onClose
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs.filter(d => d.kind === 'videoinput'));
    });
  }, []);

  const handleSave = () => {
    onSave();
    setSaveStatus('saved');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateValue = (key: string, val: number) => {
    const offsetKeyMap: Record<string, string> = {
      'posX': 'x', 'posY': 'y', 'scale': 'scale', 'rotation': 'rotation',
      'width': 'width', 'archHeight': 'archHeight', 'bottomArch': 'bottomArch', 'thickness': 'thickness'
    };
    const offsetKey = offsetKeyMap[key];

    if (config.targetSide === 'both') {
      setConfig(prev => ({
        ...prev,
        [key]: val,
        leftOffset: offsetKey ? { ...prev.leftOffset, [offsetKey]: val } : prev.leftOffset,
        rightOffset: offsetKey ? { ...prev.rightOffset, [offsetKey]: val } : prev.rightOffset
      }));
    } else {
      const sideKey = config.targetSide === 'left' ? 'leftOffset' : 'rightOffset';
      if (offsetKey) {
        setConfig(prev => ({ ...prev, [sideKey]: { ...prev[sideKey], [offsetKey]: val } }));
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
      'width': 'width', 'archHeight': 'archHeight', 'bottomArch': 'bottomArch', 'thickness': 'thickness'
    };
    const offsetKey = offsetKeyMap[key];
    return offsetKey ? (off as any)[offsetKey] : (config as any)[key];
  };

  const Slider = ({ label, value, min, max, step, onChange, precision = 1 }: any) => (
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-1.5 px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
        <span className="text-[10px] font-mono text-amber-500 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">
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
          <h1 className="text-amber-500 font-black text-2xl italic tracking-tighter leading-none">BROW MAP</h1>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Professional Android</p>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
        {(['visagism', 'position', 'shape', 'style', 'camera'] as ControlMode[]).map(mode => (
          <button
            key={mode} onClick={() => setActiveMode(mode)}
            className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase border transition-all flex-shrink-0 ${
              activeMode === mode ? 'bg-amber-500 text-black border-amber-400 shadow-xl' : 'bg-white/5 text-zinc-500 border-white/5'
            }`}
          >
            {mode === 'visagism' ? 'Simetria' : mode === 'position' ? 'Posição' : mode === 'shape' ? 'Molde' : mode === 'style' ? 'Aparência' : 'Câmera'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2">
        {(activeMode === 'position' || activeMode === 'shape') && (
          <div className="flex p-1.5 bg-white/5 rounded-3xl mb-8 border border-white/5">
            {['left', 'both', 'right'].map(side => (
              <button
                key={side} onClick={() => setConfig(p => ({ ...p, targetSide: side as any }))}
                className={`flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase transition-all ${
                  config.targetSide === side ? 'bg-amber-500 text-black' : 'text-zinc-500'
                }`}
              >
                {side === 'both' ? 'Ambas' : side === 'left' ? 'L Esq' : 'R Dir'}
              </button>
            ))}
          </div>
        )}

        {activeMode === 'visagism' && (
          <div className="space-y-6">
            <div className="p-5 bg-white/5 rounded-3xl space-y-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-100 font-bold uppercase">Grade Mestra</span>
                <button onClick={() => setConfig(p => ({ ...p, showVisagismGrid: !p.showVisagismGrid }))} className={`w-14 h-7 rounded-full transition-all relative ${config.showVisagismGrid ? 'bg-amber-500' : 'bg-zinc-800'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${config.showVisagismGrid ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-100 font-bold uppercase">Âncoras de Edição</span>
                <button onClick={() => setConfig(p => ({ ...p, showGuides: !p.showGuides }))} className={`w-14 h-7 rounded-full transition-all relative ${config.showGuides ? 'bg-amber-500' : 'bg-zinc-800'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${config.showGuides ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <Slider label="Espessura Pontos" value={config.handleSize} min={2} max={16} step={0.5} onChange={(v: number) => updateValue('handleSize', v)} />
          </div>
        )}

        {activeMode === 'position' && (
          <div className="space-y-4">
            <Slider label="Vertical" value={getDisplayValue('posY')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posY', v)} />
            <Slider label="Horizontal" value={getDisplayValue('posX')} min={-500} max={500} step={1} onChange={(v: number) => updateValue('posX', v)} />
            <Slider label="Zoom / Escala" value={getDisplayValue('scale')} min={0.2} max={4.0} step={0.01} precision={2} onChange={(v: number) => updateValue('scale', v)} />
            <Slider label="Rotação" value={getDisplayValue('rotation')} min={-90} max={90} step={0.5} onChange={(v: number) => updateValue('rotation', v)} />
          </div>
        )}

        {activeMode === 'shape' && (
          <div className="space-y-4">
            <Slider label="Comprimento" value={getDisplayValue('width')} min={30} max={350} step={1} onChange={(v: number) => updateValue('width', v)} />
            <Slider label="Altura Arco" value={getDisplayValue('archHeight')} min={0} max={120} step={1} onChange={(v: number) => updateValue('archHeight', v)} />
            <Slider label="Ajuste Arco Inferior" value={getDisplayValue('bottomArch')} min={-40} max={80} step={1} onChange={(v: number) => updateValue('bottomArch', v)} />
            <Slider label="Espessura" value={getDisplayValue('thickness')} min={1} max={50} step={0.5} onChange={(v: number) => updateValue('thickness', v)} />
          </div>
        )}

        {activeMode === 'style' && (
          <div className="space-y-8">
            <Slider label="Opacidade" value={config.opacity} min={0.05} max={1} step={0.05} precision={2} onChange={(v: number) => setConfig(p => ({ ...p, opacity: v }))} />
            <div className="grid grid-cols-6 gap-3">
              {COLORS.map(c => (
                <button key={c} onClick={() => setConfig(p => ({ ...p, color: c }))} className={`aspect-square rounded-xl border-4 ${config.color === c ? 'border-white' : 'border-white/5'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <button onClick={() => setConfig(p => ({ ...p, mirror: !p.mirror }))} className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase border ${config.mirror ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-300'}`}>
              {config.mirror ? 'Modo Espelho' : 'Câmera Direta'}
            </button>
          </div>
        )}

        {activeMode === 'camera' && (
          <div className="space-y-4">
            {devices.map((device, idx) => (
              <button key={device.deviceId} onClick={() => setSelectedCamera(device.deviceId)} className={`w-full text-left p-6 rounded-[28px] text-[10px] font-black uppercase border ${selectedCamera === device.deviceId ? 'bg-amber-500 text-black border-transparent' : 'bg-white/5 border-white/5 text-zinc-400'}`}>
                {device.label || `Módulo Óptico ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 pb-safe">
        <button onClick={onSnapshot} className="w-full py-5 bg-white text-black text-[11px] font-black uppercase rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
          Snapshot Profissional
        </button>
        <button onClick={handleSave} className={`w-full py-5 text-[11px] font-black uppercase rounded-3xl transition-all shadow-xl ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-amber-500 text-black active:scale-95'}`}>
          {saveStatus === 'saved' ? 'Design Salvo!' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default SidebarControls;
