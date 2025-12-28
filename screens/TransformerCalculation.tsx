
import React, { useState, useMemo } from 'react';

interface TransformerEntry {
  id: string;
  name: string;
  kva: number;
  vPrimary: number;
  vSecondary: number;
  phases: 1 | 3;
  zPercentage: number;
  hasSecondaryProtection: boolean;
}

const KVA_OPTIONS = [5, 10, 15, 25, 30, 37.5, 45, 50, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1250, 1500, 2000, 2500];
const VOLTAGE_OPTIONS = [120, 127, 220, 240, 440, 480, 13200, 23000, 33000];
const BREAKER_RATINGS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000];

const TransformerCalculation: React.FC = () => {
  const [transformers, setTransformers] = useState<TransformerEntry[]>([
    { id: '1', name: 'Subestación Principal', kva: 150, vPrimary: 13200, vSecondary: 220, phases: 3, zPercentage: 5, hasSecondaryProtection: true }
  ]);
  const [activeId, setActiveId] = useState<string>('1');

  const activeTrans = useMemo(() => transformers.find(t => t.id === activeId) || transformers[0], [transformers, activeId]);

  const calculateData = (t: TransformerEntry) => {
    const factor = t.phases === 3 ? Math.sqrt(3) : 1;
    const iPri = (t.kva * 1000) / (t.vPrimary * factor);
    const iSec = (t.kva * 1000) / (t.vSecondary * factor);

    // Sizing based on Art. 450-3(b) (Transformers 600V or less) or 450-3(a) (Over 600V)
    // Simplified logic for a professional tool:
    let priMultiplier = 1.25;
    let secMultiplier = 1.25;

    if (t.vPrimary > 600) {
      // Over 600V logic (Table 450-3(a))
      // With secondary protection, Primary can be up to 600% (fuses) or 300% (breaker)
      priMultiplier = t.hasSecondaryProtection ? 3.0 : 1.25;
      secMultiplier = 1.25;
    } else {
      // 600V or less (Table 450-3(b))
      // If primary only: 125%
      // If primary + secondary: Primary 250%, Secondary 125%
      priMultiplier = t.hasSecondaryProtection ? 2.5 : 1.25;
      secMultiplier = 1.25;
    }

    const priMin = iPri * priMultiplier;
    const secMin = iSec * secMultiplier;

    const suggestedPri = BREAKER_RATINGS.find(r => r >= priMin) || BREAKER_RATINGS[BREAKER_RATINGS.length - 1];
    const suggestedSec = BREAKER_RATINGS.find(r => r >= secMin) || BREAKER_RATINGS[BREAKER_RATINGS.length - 1];

    return {
      iPri: Number(iPri.toFixed(2)),
      iSec: Number(iSec.toFixed(2)),
      priMin: Number(priMin.toFixed(2)),
      secMin: Number(secMin.toFixed(2)),
      suggestedPri,
      suggestedSec
    };
  };

  const results = useMemo(() => calculateData(activeTrans), [activeTrans]);

  const addTransformer = () => {
    if (transformers.length >= 20) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setTransformers([...transformers, { 
      id: newId, 
      name: `Transformador ${transformers.length + 1}`, 
      kva: 45, 
      vPrimary: 480, 
      vSecondary: 220, 
      phases: 3, 
      zPercentage: 3, 
      hasSecondaryProtection: true 
    }]);
    setActiveId(newId);
  };

  const updateTransformer = (id: string, updates: Partial<TransformerEntry>) => {
    setTransformers(transformers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTransformer = (id: string) => {
    if (transformers.length <= 1) return;
    const newTrans = transformers.filter(t => t.id !== id);
    setTransformers(newTrans);
    if (activeId === id) setActiveId(newTrans[0].id);
  };

  const askAiBasis = () => {
    const prompt = `Actúa como perito en la NOM-001-SEDE-2012. Explica el dimensionamiento de protecciones para un transformador de ${activeTrans.kva} kVA, ${activeTrans.vPrimary}V/${activeTrans.vSecondary}V, ${activeTrans.phases} fases. 
    Justifica los multiplicadores usados (${activeTrans.hasSecondaryProtection ? 'Primario 250% y Secundario 125%' : 'Primario 125%'}) basándote en el Artículo 450-3 y la Tabla correspondiente.`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const exportCSV = () => {
    const headers = ["Nombre", "Capacidad(kVA)", "V-Primario", "V-Secundario", "I-Primaria(A)", "I-Secundaria(A)", "Prot-Primaria(A)", "Prot-Secundaria(A)"];
    const rows = transformers.map(t => {
      const res = calculateData(t);
      return [t.name, t.kva, t.vPrimary, t.vSecondary, res.iPri, res.iSec, res.suggestedPri, t.hasSecondaryProtection ? res.suggestedSec : 'N/A'];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transformadores_nom001_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Dimensionamiento de Transformadores</h1>
          <p className="text-text-secondary mt-1">Artículo 450 - Protecciones Primarias y Secundarias.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-[#283039] rounded-lg text-sm font-bold text-white hover:bg-[#3b4754] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button onClick={addTransformer} disabled={transformers.length >= 20} className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Trafo ({transformers.length}/20)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {transformers.map(t => {
            const res = calculateData(t);
            return (
              <div 
                key={t.id} 
                onClick={() => setActiveId(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                  activeId === t.id ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-lg shadow-primary/5' : 'bg-surface-dark border-border-dark hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase text-text-secondary truncate pr-4">{t.name}</span>
                  {transformers.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeTransformer(t.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black">{t.kva} <span className="text-xs text-primary">kVA</span></span>
                  <div className="text-right">
                    <span className="text-[10px] block text-text-secondary">{t.vPrimary}V → {t.vSecondary}V</span>
                    <span className="text-[9px] font-bold text-white uppercase">{t.phases} Fase(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-dark rounded-2xl p-8 border border-border-dark shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">electrical_services</span>
              Ficha Técnica del Transformador
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Identificación</label>
                <input 
                  type="text" 
                  value={activeTrans.name}
                  onChange={(e) => updateTransformer(activeTrans.id, { name: e.target.value })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Capacidad (kVA)</label>
                  <select 
                    value={activeTrans.kva}
                    onChange={(e) => updateTransformer(activeTrans.id, { kva: Number(e.target.value) })}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                  >
                    {KVA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} kVA</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Fases</label>
                  <select 
                    value={activeTrans.phases}
                    onChange={(e) => updateTransformer(activeTrans.id, { phases: Number(e.target.value) as 1 | 3 })}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                  >
                    <option value={1}>1 Φ (Monofásico)</option>
                    <option value={3}>3 Φ (Trifásico)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Tensión Primaria (V)</label>
                  <select 
                    value={activeTrans.vPrimary}
                    onChange={(e) => updateTransformer(activeTrans.id, { vPrimary: Number(e.target.value) })}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                  >
                    {VOLTAGE_OPTIONS.map(v => <option key={v} value={v}>{v} V</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Tensión Secundaria (V)</label>
                  <select 
                    value={activeTrans.vSecondary}
                    onChange={(e) => updateTransformer(activeTrans.id, { vSecondary: Number(e.target.value) })}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                  >
                    {VOLTAGE_OPTIONS.filter(v => v < activeTrans.vPrimary).map(v => <option key={v} value={v}>{v} V</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border-dark flex items-center justify-between">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-text-secondary uppercase">Esquema de Protección</span>
                   <span className="text-xs text-white opacity-60">Determina multiplicadores según Art. 450-3</span>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">Protección Secundaria</span>
                  <div 
                    onClick={() => updateTransformer(activeTrans.id, { hasSecondaryProtection: !activeTrans.hasSecondaryProtection })}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${activeTrans.hasSecondaryProtection ? 'bg-primary' : 'bg-[#283039]'}`}
                  >
                    <div className={`size-4 bg-white rounded-full transition-all ${activeTrans.hasSecondaryProtection ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <div className="p-6 bg-[#111418] border border-border-dark rounded-2xl flex items-center gap-4 group cursor-help hover:border-primary/50 transition-all">
             <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined">info</span>
             </div>
             <div>
                <p className="text-[10px] font-bold text-primary uppercase">Criterio de Cálculo</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Basado en {activeTrans.vPrimary > 600 ? 'Tabla 450-3(a) > 600V' : 'Tabla 450-3(b) ≤ 600V'}. 
                  Factor Primario: <span className="text-white font-bold">{activeTrans.hasSecondaryProtection ? (activeTrans.vPrimary > 600 ? '300%' : '250%') : '125%'}</span>.
                </p>
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Corrientes Nominales</h3>
               <button onClick={askAiBasis} className="size-10 bg-[#283039] hover:bg-primary text-white rounded-lg flex items-center justify-center transition-all group">
                 <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">psychology</span>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase mb-1">Primaria (FLA)</span>
                <span className="text-4xl font-black text-white">{results.iPri}A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase mb-1">Secundaria (FLA)</span>
                <span className="text-4xl font-black text-white">{results.iSec}A</span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="p-5 bg-gradient-to-r from-primary/20 to-transparent border border-primary/20 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Breaker Primario</span>
                    <span className="text-xs font-bold text-white px-2 py-0.5 bg-primary/20 rounded">Next Std</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white">{results.suggestedPri}</span>
                    <span className="text-xl font-bold text-primary mb-1">AMPS</span>
                  </div>
               </div>

               {activeTrans.hasSecondaryProtection && (
                 <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Breaker Secundario</span>
                      <span className="text-xs font-bold text-white px-2 py-0.5 bg-emerald-500/20 rounded">Next Std</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black text-white">{results.suggestedSec}</span>
                      <span className="text-xl font-bold text-emerald-500 mb-1">AMPS</span>
                    </div>
                 </div>
               )}

               {!activeTrans.hasSecondaryProtection && (
                 <div className="p-5 bg-[#111418] border border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center opacity-40">
                    <span className="material-symbols-outlined text-3xl mb-1 text-text-secondary">do_not_disturb_on</span>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Sin Prot. Secundaria</p>
                 </div>
               )}
            </div>

            <p className="mt-8 text-[9px] text-text-secondary italic text-center leading-relaxed">
              * El dimensionamiento debe ajustarse a la capacidad real de los conductores seleccionados (Art. 240-3). 
              Ver módulo de Ampacidad para cables.
            </p>
          </div>

          <div className="bg-[#1a222c] border border-border-dark rounded-2xl p-6">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase mb-4 tracking-widest">Capacidades Estándar (Art. 240-6)</h4>
            <div className="flex flex-wrap gap-1.5">
              {BREAKER_RATINGS.slice(0, 15).map(r => (
                <div key={r} className={`px-2 py-1 rounded text-[10px] font-bold border ${r === results.suggestedPri ? 'bg-primary border-primary text-white' : 'bg-[#11161c] border-border-dark text-text-secondary'}`}>
                  {r}A
                </div>
              ))}
              <span className="text-[10px] text-text-secondary self-center ml-2">...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformerCalculation;
