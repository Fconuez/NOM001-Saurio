
import React, { useState, useMemo } from 'react';
import { TABLE_8_CONDUCTORS } from '../constants';

interface AmpacityEntry {
  id: string;
  name: string;
  material: 'Cu' | 'Al';
  tempRating: 60 | 75 | 90;
  awg: string;
  ambientTemp: number;
  conductorCount: number;
}

// Simplified data for Table 310-15(b)(16) - Copper
const AMPACITY_TABLE_CU: Record<string, Record<number, number>> = {
  '14': { 60: 15, 75: 20, 90: 25 },
  '12': { 60: 20, 75: 25, 90: 30 },
  '10': { 60: 30, 75: 35, 90: 40 },
  '8': { 60: 40, 75: 50, 90: 55 },
  '6': { 60: 55, 75: 65, 90: 75 },
  '4': { 60: 70, 75: 85, 90: 95 },
  '3': { 60: 85, 75: 100, 90: 110 },
  '2': { 60: 95, 75: 115, 90: 130 },
  '1': { 60: 110, 75: 130, 90: 150 },
  '1/0': { 60: 125, 75: 150, 90: 170 },
  '2/0': { 60: 145, 75: 175, 90: 195 },
  '3/0': { 60: 165, 75: 200, 90: 225 },
  '4/0': { 60: 195, 75: 230, 90: 260 },
};

// Simplified data for Table 310-15(b)(16) - Aluminum
const AMPACITY_TABLE_AL: Record<string, Record<number, number>> = {
  '12': { 60: 15, 75: 20, 90: 25 },
  '10': { 60: 25, 75: 30, 90: 35 },
  '8': { 60: 30, 75: 40, 90: 45 },
  '6': { 60: 40, 75: 50, 90: 60 },
  '4': { 60: 55, 75: 65, 90: 75 },
  '3': { 60: 65, 75: 75, 90: 85 },
  '2': { 60: 75, 75: 90, 90: 100 },
  '1': { 60: 85, 75: 100, 90: 115 },
  '1/0': { 60: 100, 75: 120, 90: 135 },
  '2/0': { 60: 115, 75: 135, 90: 150 },
  '3/0': { 60: 130, 75: 155, 90: 175 },
  '4/0': { 60: 150, 75: 180, 90: 205 },
};

const getGroupingFactor = (count: number): number => {
  if (count <= 3) return 1.0;
  if (count <= 6) return 0.8;
  if (count <= 9) return 0.7;
  if (count <= 20) return 0.5;
  if (count <= 30) return 0.45;
  if (count <= 40) return 0.40;
  return 0.35;
};

const getTempCorrectionFactor = (temp: number, rating: number): number => {
  if (rating === 75) {
    if (temp <= 25) return 1.05;
    if (temp <= 30) return 1.00;
    if (temp <= 35) return 0.94;
    if (temp <= 40) return 0.88;
    if (temp <= 45) return 0.82;
    if (temp <= 50) return 0.75;
    if (temp <= 55) return 0.67;
    if (temp <= 60) return 0.58;
    if (temp <= 70) return 0.33;
    return 0;
  }
  if (rating === 90) {
    if (temp <= 25) return 1.04;
    if (temp <= 30) return 1.00;
    if (temp <= 35) return 0.96;
    if (temp <= 40) return 0.91;
    if (temp <= 45) return 0.87;
    if (temp <= 50) return 0.82;
    if (temp <= 55) return 0.76;
    if (temp <= 60) return 0.71;
    if (temp <= 70) return 0.58;
    if (temp <= 80) return 0.41;
    return 0;
  }
  // 60C
  if (temp <= 25) return 1.08;
  if (temp <= 30) return 1.00;
  if (temp <= 35) return 0.91;
  if (temp <= 40) return 0.82;
  if (temp <= 45) return 0.71;
  if (temp <= 50) return 0.58;
  if (temp <= 55) return 0.41;
  return 0;
};

const AmpacityCalculation: React.FC = () => {
  const [entries, setEntries] = useState<AmpacityEntry[]>([
    { id: '1', name: 'Alimentador Principal', material: 'Cu', tempRating: 75, awg: '1/0', ambientTemp: 35, conductorCount: 3 }
  ]);
  const [activeId, setActiveId] = useState<string>('1');

  const activeEntry = useMemo(() => entries.find(e => e.id === activeId) || entries[0], [entries, activeId]);

  const calculateResult = (entry: AmpacityEntry) => {
    const table = entry.material === 'Cu' ? AMPACITY_TABLE_CU : AMPACITY_TABLE_AL;
    const baseAmp = table[entry.awg]?.[entry.tempRating] || 0;
    const groupingFactor = getGroupingFactor(entry.conductorCount);
    const tempFactor = getTempCorrectionFactor(entry.ambientTemp, entry.tempRating);
    const correctedAmp = baseAmp * groupingFactor * tempFactor;

    return {
      baseAmp,
      groupingFactor,
      tempFactor,
      correctedAmp: Number(correctedAmp.toFixed(1))
    };
  };

  const activeResult = useMemo(() => calculateResult(activeEntry), [activeEntry]);

  const addEntry = () => {
    if (entries.length >= 30) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setEntries([...entries, { 
      id: newId, 
      name: `Circuito ${entries.length + 1}`, 
      material: 'Cu', 
      tempRating: 75, 
      awg: '12', 
      ambientTemp: 30, 
      conductorCount: 3 
    }]);
    setActiveId(newId);
  };

  const updateEntry = (id: string, updates: Partial<AmpacityEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    if (activeId === id) setActiveId(newEntries[0].id);
  };

  const askAiBasis = () => {
    const prompt = `Explica el fundamento normativo para la ampacidad del conductor ${activeEntry.awg} ${activeEntry.material} a ${activeEntry.tempRating}°C, considerando una temperatura ambiente de ${activeEntry.ambientTemp}°C y ${activeEntry.conductorCount} conductores portadores de corriente en la misma canalización. Refiere a la Tabla 310-15(b)(16) y factores de ajuste de la NOM-001-SEDE-2012.`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const exportCSV = () => {
    const headers = ["Nombre", "Material", "Temp Rating", "Calibre", "Temp Amb", "Num Cond", "Amp Base", "Factor Agrup", "Factor Temp", "Amp Final"];
    const rows = entries.map(e => {
      const res = calculateResult(e);
      return [e.name, e.material, e.tempRating, e.awg, e.ambientTemp, e.conductorCount, res.baseAmp, res.groupingFactor, res.tempFactor, res.correctedAmp];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ampacidad_nom001_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Cálculo de Ampacidad</h1>
          <p className="text-text-secondary mt-1">Tabla 310-15(b)(16) y Factores de Ajuste NOM-001.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-[#283039] rounded-lg text-sm font-bold text-white hover:bg-[#3b4754] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar CSV
          </button>
          <button onClick={addEntry} disabled={entries.length >= 30} className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo ({entries.length}/30)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {entries.map(e => {
            const res = calculateResult(e);
            return (
              <div key={e.id} onClick={() => setActiveId(e.id)} className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${activeId === e.id ? 'bg-primary/10 border-primary' : 'bg-surface-dark border-border-dark hover:border-gray-500'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold uppercase text-text-secondary truncate pr-4">{e.name}</span>
                  {entries.length > 1 && (
                    <button onClick={(ev) => { ev.stopPropagation(); removeEntry(e.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 rounded">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black">{res.correctedAmp}A</span>
                  <span className="text-[10px] text-text-secondary">{e.awg} {e.material} @ {e.tempRating}°C</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-dark rounded-2xl p-8 border border-border-dark shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Parámetros del Conductor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Nombre</label>
                <input type="text" value={activeEntry.name} onChange={(e) => updateEntry(activeEntry.id, { name: e.target.value })} className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm focus:ring-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Material</label>
                <select value={activeEntry.material} onChange={(e) => updateEntry(activeEntry.id, { material: e.target.value as 'Cu' | 'Al' })} className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm">
                  <option value="Cu">Cobre (Cu)</option>
                  <option value="Al">Aluminio (Al)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Aislamiento (°C)</label>
                <select value={activeEntry.tempRating} onChange={(e) => updateEntry(activeEntry.id, { tempRating: Number(e.target.value) as 60 | 75 | 90 })} className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm">
                  <option value={60}>60°C (TW, UF)</option>
                  <option value={75}>75°C (THHW, THW, RHW)</option>
                  <option value={90}>90°C (THHN, THWN-2, XHHW)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Calibre AWG</label>
                <select value={activeEntry.awg} onChange={(e) => updateEntry(activeEntry.id, { awg: e.target.value })} className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm">
                  {Object.keys(activeEntry.material === 'Cu' ? AMPACITY_TABLE_CU : AMPACITY_TABLE_AL).map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Temp. Ambiente (°C)</label>
                <input type="number" value={activeEntry.ambientTemp} onChange={(e) => updateEntry(activeEntry.id, { ambientTemp: Number(e.target.value) })} className="w-full rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">Conductores en Canalización (Agrupamiento)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="1" max="45" value={activeEntry.conductorCount} onChange={(e) => updateEntry(activeEntry.id, { conductorCount: Number(e.target.value) })} className="flex-1 h-2 bg-[#11161c] rounded-lg appearance-none cursor-pointer accent-primary" />
                  <span className="text-xl font-bold w-12 text-center">{activeEntry.conductorCount}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <h4 className="font-bold text-sm">Nota de Selección</h4>
             </div>
             <p className="text-xs text-text-secondary leading-relaxed">
               Para equipos de 100A o menos, se debe usar la columna de 60°C a menos que los terminales estén marcados para 75°C (Art. 110-14).
             </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-dark rounded-3xl border border-border-dark p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-6">
              <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Ampacidad Corregida</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 mb-8">
              <span className="text-8xl font-black text-white tracking-tighter">{activeResult.correctedAmp}</span>
              <span className="text-3xl font-bold text-primary">AMPERES</span>
            </div>

            <div className="w-full space-y-4 border-t border-border-dark pt-8">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary uppercase font-bold">Base Tabla 310-15</span>
                <span className="text-sm font-bold">{activeResult.baseAmp}A</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary uppercase font-bold">Ajuste por Temp. ({activeEntry.ambientTemp}°C)</span>
                <span className={`text-sm font-bold ${activeResult.tempFactor < 1 ? 'text-orange-500' : 'text-emerald-500'}`}>× {activeResult.tempFactor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary uppercase font-bold">Ajuste Agrup. ({activeEntry.conductorCount} cond.)</span>
                <span className={`text-sm font-bold ${activeResult.groupingFactor < 1 ? 'text-red-500' : 'text-emerald-500'}`}>× {activeResult.groupingFactor}</span>
              </div>
              
              <button onClick={askAiBasis} className="w-full mt-4 py-3 bg-[#111418] border border-border-dark hover:border-primary text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Interpretar Base Normativa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <p className="text-[10px] font-bold text-text-secondary uppercase mb-2">Pérdida Total</p>
                <p className="text-2xl font-black text-red-500">
                  {((1 - (activeResult.tempFactor * activeResult.groupingFactor)) * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-text-secondary mt-1">Capacidad reducida por factores externos.</p>
             </div>
             <div className="bg-surface-dark p-6 rounded-2xl border border-border-dark">
                <p className="text-[10px] font-bold text-text-secondary uppercase mb-2">Carga Sugerida</p>
                <p className="text-2xl font-black text-emerald-500">
                  {(activeResult.correctedAmp * 0.8).toFixed(1)}A
                </p>
                <p className="text-[10px] text-text-secondary mt-1">Continuo (80%) según Art. 210-20.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmpacityCalculation;
