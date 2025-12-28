
import React, { useState, useMemo } from 'react';
import { TABLE_8_CONDUCTORS } from '../constants';

interface ConductorEntry {
  id: string;
  insulation: string;
  awg: string;
  qty: number;
}

const ConduitSizing: React.FC = () => {
  const [conduitType, setConduitType] = useState('PVC-40');
  const [entries, setEntries] = useState<ConductorEntry[]>([
    { id: '1', insulation: 'THHW-LS', awg: '1/0', qty: 3 },
  ]);

  const addEntry = () => {
    if (entries.length >= 30) return;
    setEntries([...entries, { id: Math.random().toString(36).substr(2, 9), insulation: 'THHW-LS', awg: '12', qty: 3 }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<ConductorEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const totals = useMemo(() => {
    let totalArea = 0;
    entries.forEach(e => {
      const cond = TABLE_8_CONDUCTORS.find(t => t.awg === e.awg);
      if (cond) {
        // Approximate area including insulation (simplified factor)
        const areaWithIns = cond.area_mm2 * 1.8; 
        totalArea += areaWithIns * e.qty;
      }
    });

    // Suggestion logic based on 40% fill
    let suggestion = '2"';
    if (totalArea < 78) suggestion = '1/2"';
    else if (totalArea < 137) suggestion = '3/4"';
    else if (totalArea < 222) suggestion = '1"';
    else if (totalArea < 420) suggestion = '1 1/4"';
    else if (totalArea < 534) suggestion = '1 1/2"';
    else if (totalArea < 878) suggestion = '2"';
    else if (totalArea < 1500) suggestion = '3"';
    else suggestion = '4"';

    return { area: Math.round(totalArea), suggestion };
  }, [entries]);

  const totalQty = useMemo(() => entries.reduce((acc, e) => acc + e.qty, 0), [entries]);
  const fillFactor = totalQty === 1 ? '53%' : totalQty === 2 ? '31%' : '40%';

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end border-b border-border-dark pb-6">
          <div>
              <h1 className="text-3xl font-black">Cálculo de Tubería (Fill)</h1>
              <p className="text-text-secondary mt-1">Conforme a Tablas del Capítulo 10 - NOM-001.</p>
          </div>
          <button 
            onClick={addEntry}
            disabled={entries.length >= 30}
            className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Agregar Conductor ({entries.length}/30)
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2">
          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-12 gap-4 items-center p-5 bg-surface-dark rounded-xl border border-border-dark hover:border-gray-500 transition-all group">
              <div className="col-span-12 md:col-span-5">
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Calibre AWG</label>
                <select 
                  value={entry.awg}
                  onChange={(e) => updateEntry(entry.id, { awg: e.target.value })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg p-2.5 text-sm focus:ring-primary"
                >
                  {TABLE_8_CONDUCTORS.map(t => <option key={t.awg} value={t.awg}>{t.awg}</option>)}
                </select>
              </div>
              <div className="col-span-8 md:col-span-4">
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={entry.qty}
                  onChange={(e) => updateEntry(entry.id, { qty: Number(e.target.value) })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg p-2.5 text-sm focus:ring-primary" 
                />
              </div>
              <div className="col-span-4 md:col-span-3 flex justify-end">
                <button 
                  onClick={() => removeEntry(entry.id)}
                  className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-dark border border-border-dark rounded-2xl p-10 text-center flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">MÁX {fillFactor}</span>
            </div>
            <h2 className="text-text-secondary text-sm font-bold uppercase tracking-widest">Canalización Sugerida</h2>
            <div className="text-white text-8xl font-black my-8 drop-shadow-md">{totals.suggestion}</div>
            <select 
              value={conduitType}
              onChange={(e) => setConduitType(e.target.value)}
              className="bg-[#11161c] border-border-dark text-text-secondary text-xs rounded-full px-6 py-2 uppercase font-black"
            >
              <option value="PVC-40">PVC SCH 40</option>
              <option value="RMC">RMC (Metal Pesado)</option>
              <option value="EMT">EMT (Pared Delgada)</option>
              <option value="LFMC">Liquid Tight</option>
            </select>
            <div className="mt-10 w-full flex justify-between text-[10px] font-black text-text-secondary border-t border-border-dark pt-6 uppercase tracking-tighter">
              <span>Área Total: {totals.area} mm²</span>
              <span className="text-primary">NOM-001 Cap 10 Tab 1</span>
            </div>
          </section>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6">
             <div className="flex items-center gap-3 mb-4">
               <span className="material-symbols-outlined text-primary">analytics</span>
               <h3 className="font-bold text-sm">Análisis de Ocupación</h3>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between text-xs">
                 <span className="text-text-secondary">Total Conductores:</span>
                 <span className="font-bold text-white">{totalQty}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-text-secondary">Factor de Relleno:</span>
                 <span className="font-bold text-white">{fillFactor}</span>
               </div>
               <div className="flex justify-between text-xs pt-2 border-t border-blue-600/10">
                 <span className="text-text-secondary">Factor de Ajuste (Derating):</span>
                 <span className={`font-bold ${totalQty > 3 ? 'text-orange-500' : 'text-emerald-500'}`}>
                   {totalQty > 3 ? 'Aplicar Art. 310-15' : 'Sin ajuste'}
                 </span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConduitSizing;
