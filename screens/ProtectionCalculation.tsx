
import React, { useState, useMemo } from 'react';

interface ProtectionEntry {
  id: string;
  name: string;
  loadAmps: number;
  isContinuous: boolean;
  phases: 1 | 2 | 3;
  type: 'ITM' | 'Fuse';
}

const STANDARD_RATINGS = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000
];

const ProtectionCalculation: React.FC = () => {
  const [entries, setEntries] = useState<ProtectionEntry[]>([
    { id: '1', name: 'Protección Principal', loadAmps: 80, isContinuous: true, phases: 3, type: 'ITM' }
  ]);
  const [activeId, setActiveId] = useState<string>('1');

  const activeEntry = useMemo(() => entries.find(e => e.id === activeId) || entries[0], [entries, activeId]);

  const calculateProtection = (entry: ProtectionEntry) => {
    // Art. 210-20(a) and 215-3: OCPD must be at least 125% of continuous load
    const multiplier = entry.isContinuous ? 1.25 : 1.0;
    const minRating = entry.loadAmps * multiplier;
    
    // Find next standard rating (Art. 240-6)
    const suggestedRating = STANDARD_RATINGS.find(r => r >= minRating) || STANDARD_RATINGS[STANDARD_RATINGS.length - 1];
    
    return {
      minRating: Number(minRating.toFixed(2)),
      suggestedRating,
      isOversized: suggestedRating > minRating
    };
  };

  const activeResult = useMemo(() => calculateProtection(activeEntry), [activeEntry]);

  const addEntry = () => {
    if (entries.length >= 30) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setEntries([...entries, { 
      id: newId, 
      name: `Carga ${entries.length + 1}`, 
      loadAmps: 20, 
      isContinuous: false, 
      phases: 1, 
      type: 'ITM' 
    }]);
    setActiveId(newId);
  };

  const updateEntry = (id: string, updates: Partial<ProtectionEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    if (activeId === id) setActiveId(newEntries[0].id);
  };

  const askAiBasis = () => {
    const prompt = `Explica el fundamento normativo para seleccionar una protección de ${activeResult.suggestedRating}A para una carga de ${activeEntry.loadAmps}A (${activeEntry.isContinuous ? 'continua' : 'no continua'}) según la NOM-001-SEDE-2012. Cita Art. 240-6 (Capacidad estándar) y Art. 210-20 / 215-3 (Cargas continuas al 125%).`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const shareReport = () => {
    const prompt = `Genera un informe de selección de protección:
- Identificador: ${activeEntry.name}
- Carga Nominal: ${activeEntry.loadAmps} A
- Uso Continuo: ${activeEntry.isContinuous ? 'Sí (125%)' : 'No (100%)'}
- Fases: ${activeEntry.phases}
- Tipo: ${activeEntry.type}
- Capacidad Sugerida: ${activeResult.suggestedRating} A
Concluye con la referencia a la Tabla 240-6 de la NOM-001-SEDE-2012.`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const exportCSV = () => {
    const headers = ["Nombre", "Carga(A)", "Continuo", "Fases", "Tipo", "Min Requerido(A)", "Sugerido(A)"];
    const rows = entries.map(e => {
      const res = calculateProtection(e);
      return [e.name, e.loadAmps, e.isContinuous ? "SI" : "NO", e.phases, e.type, res.minRating, res.suggestedRating];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `protecciones_nom001_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Módulo de Protecciones (Art. 240)</h1>
          <p className="text-text-secondary mt-1">Selección de ITM y Fusibles bajo estándares de la NOM-001.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-[#283039] rounded-lg text-sm font-bold text-white hover:bg-[#3b4754] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button onClick={addEntry} disabled={entries.length >= 30} className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">add</span>
            Nueva ({entries.length}/30)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar list */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {entries.map(e => {
            const res = calculateProtection(e);
            return (
              <div key={e.id} onClick={() => setActiveId(e.id)} className={`p-4 rounded-xl border cursor-pointer transition-all group ${activeId === e.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-surface-dark border-border-dark hover:border-gray-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase text-text-secondary truncate pr-4">{e.name}</span>
                  {entries.length > 1 && (
                    <button onClick={(ev) => { ev.stopPropagation(); removeEntry(e.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black">{res.suggestedRating}A</span>
                    <span className="text-[10px] font-bold text-primary">{e.type} {e.phases}P</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-text-secondary block">Carga: {e.loadAmps}A</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${e.isContinuous ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {e.isContinuous ? 'CONTINUO' : 'NO CONT.'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-dark rounded-2xl p-8 border border-border-dark shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">shield</span>
              Parámetros de Diseño
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Etiqueta de Identificación</label>
                <input 
                  type="text" 
                  value={activeEntry.name} 
                  onChange={(e) => updateEntry(activeEntry.id, { name: e.target.value })} 
                  className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-11 px-4 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Carga Nominal (A)</label>
                  <input 
                    type="number" 
                    value={activeEntry.loadAmps} 
                    onChange={(e) => updateEntry(activeEntry.id, { loadAmps: Number(e.target.value) })} 
                    className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-11 px-4 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Fases / Polos</label>
                  <select 
                    value={activeEntry.phases} 
                    onChange={(e) => updateEntry(activeEntry.id, { phases: Number(e.target.value) as 1 | 2 | 3 })} 
                    className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-11 px-4"
                  >
                    <option value={1}>1 Polo (Monofásico)</option>
                    <option value={2}>2 Polos (Bifásico)</option>
                    <option value={3}>3 Polos (Trifásico)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Tipo de Protección</label>
                  <div className="flex bg-[#11161c] p-1 rounded-lg border border-border-dark">
                    <button 
                      onClick={() => updateEntry(activeEntry.id, { type: 'ITM' })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${activeEntry.type === 'ITM' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      ITM
                    </button>
                    <button 
                      onClick={() => updateEntry(activeEntry.id, { type: 'Fuse' })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${activeEntry.type === 'Fuse' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      FUSIBLE
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Régimen de Uso</label>
                  <div className="flex bg-[#11161c] p-1 rounded-lg border border-border-dark">
                    <button 
                      onClick={() => updateEntry(activeEntry.id, { isContinuous: false })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${!activeEntry.isContinuous ? 'bg-blue-500 text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      NO CONT.
                    </button>
                    <button 
                      onClick={() => updateEntry(activeEntry.id, { isContinuous: true })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${activeEntry.isContinuous ? 'bg-orange-500 text-white' : 'text-text-secondary hover:text-white'}`}
                    >
                      CONT. (125%)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-[#111418] border border-border-dark rounded-2xl p-6">
            <h4 className="text-xs font-bold text-primary uppercase mb-3">Resumen de Cálculo Art. 240</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Carga Directa:</span>
                <span className="text-white font-mono">{activeEntry.loadAmps} A</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Factor de Uso ({activeEntry.isContinuous ? '125%' : '100%'}):</span>
                <span className="text-white font-mono">× {activeEntry.isContinuous ? '1.25' : '1.00'}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border-dark font-bold">
                <span className="text-text-secondary">Corriente Mínima Requerida:</span>
                <span className="text-primary font-mono">{activeResult.minRating} A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-dark rounded-3xl border border-border-dark p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[400px]">
            <div className="absolute top-0 right-0 p-6 flex gap-2">
              <button onClick={shareReport} className="size-9 bg-[#283039] hover:bg-primary text-white rounded-lg flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-4">Capacidad Estándar Sugerida</p>
              <div className="relative inline-block">
                <span className="text-[9rem] font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                  {activeResult.suggestedRating}
                </span>
                <span className="absolute -right-12 bottom-6 text-4xl font-bold text-primary">A</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Cumple Art. 240-6 (NOM)</p>
              </div>
            </div>

            <div className="w-full mt-10 space-y-4">
              <button onClick={askAiBasis} className="w-full py-4 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Ver Interpretación Normativa AI
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1a222c] to-[#111418] p-6 rounded-2xl border border-border-dark">
            <h5 className="text-[10px] font-bold text-text-secondary uppercase mb-4 tracking-widest">Capacidades Estándar Cercanas</h5>
            <div className="flex flex-wrap gap-2">
              {STANDARD_RATINGS.filter(r => Math.abs(r - activeResult.suggestedRating) < 100).map(r => (
                <div key={r} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${r === activeResult.suggestedRating ? 'bg-primary border-primary text-white shadow-lg' : 'bg-[#11161c] border-border-dark text-text-secondary'}`}>
                  {r}A
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionCalculation;
