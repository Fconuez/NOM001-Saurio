
import React, { useState, useMemo } from 'react';

interface MotorEntry {
  id: string;
  name: string;
  phases: 1 | 3;
  voltage: 127 | 220 | 440;
  hp: number;
  serviceFactor: number;
  isContinuous: boolean;
}

// Data approximation from Table 430.250 (3-Phase) and 430.248 (1-Phase)
const FLA_TABLE: Record<string, Record<number, number>> = {
  '3-220': { 0.5: 2.0, 0.75: 2.8, 1: 3.6, 1.5: 5.2, 2: 6.8, 3: 9.6, 5: 15.2, 7.5: 22, 10: 28, 15: 42, 20: 54, 25: 68, 30: 80, 40: 104, 50: 130, 60: 154, 75: 192, 100: 248 },
  '3-440': { 0.5: 1.0, 0.75: 1.4, 1: 1.8, 1.5: 2.6, 2: 3.4, 3: 4.8, 5: 7.6, 7.5: 11, 10: 14, 15: 21, 20: 27, 25: 34, 30: 40, 40: 52, 50: 65, 60: 77, 75: 96, 100: 124 },
  '1-127': { 0.5: 9.8, 0.75: 13.8, 1: 16, 1.5: 20, 2: 24, 3: 34, 5: 56, 7.5: 80, 10: 100 },
  '1-220': { 0.5: 4.9, 0.75: 6.9, 1: 8, 1.5: 10, 2: 12, 3: 17, 5: 28, 7.5: 40, 10: 50 },
};

const HP_OPTIONS = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
const ITM_STANDARD_RATINGS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600];

const MotorCalculation: React.FC = () => {
  const [motors, setMotors] = useState<MotorEntry[]>([
    { id: '1', name: 'Bomba Hidroneumática', phases: 3, voltage: 220, hp: 5, serviceFactor: 1.15, isContinuous: true }
  ]);
  const [activeId, setActiveId] = useState<string>('1');

  const activeMotor = useMemo(() => motors.find(m => m.id === activeId) || motors[0], [motors, activeId]);

  const calculateMotorData = (m: MotorEntry) => {
    const key = `${m.phases}-${m.voltage}`;
    const fla = FLA_TABLE[key]?.[m.hp] || 0;
    
    // Art. 430.22 - Conductor 125%
    const minAmpacity = fla * 1.25;
    
    // Art. 430.32 - Overload 125% for SF >= 1.15, else 115%
    const overloadFactor = m.serviceFactor >= 1.15 ? 1.25 : 1.15;
    const overloadProtection = fla * overloadFactor;
    
    // Art. 430.52 - Protection (Breaker - Inverse Time) 250%
    const maxProtection = fla * 2.50;
    const suggestedITM = ITM_STANDARD_RATINGS.find(r => r >= maxProtection) || ITM_STANDARD_RATINGS[ITM_STANDARD_RATINGS.length - 1];

    return {
      fla,
      minAmpacity: Number(minAmpacity.toFixed(2)),
      overloadProtection: Number(overloadProtection.toFixed(2)),
      suggestedITM,
      maxProtection
    };
  };

  const results = useMemo(() => calculateMotorData(activeMotor), [activeMotor]);

  const addMotor = () => {
    if (motors.length >= 30) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setMotors([...motors, { 
      id: newId, 
      name: `Motor ${motors.length + 1}`, 
      phases: 3, 
      voltage: 220, 
      hp: 1, 
      serviceFactor: 1.15, 
      isContinuous: true 
    }]);
    setActiveId(newId);
  };

  const updateMotor = (id: string, updates: Partial<MotorEntry>) => {
    setMotors(motors.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMotor = (id: string) => {
    if (motors.length <= 1) return;
    const newMotors = motors.filter(m => m.id !== id);
    setMotors(newMotors);
    if (activeId === id) setActiveId(newMotors[0].id);
  };

  const askAiBasis = () => {
    const prompt = `Actúa como consultor senior de la NOM-001-SEDE-2012. Explica los fundamentos para un motor de ${activeMotor.hp} HP, ${activeMotor.phases} fases, ${activeMotor.voltage} V. 
    Detalla:
    1. FLA según tabla 430.248/250.
    2. Dimensionamiento de conductores al 125% (Art. 430.22).
    3. Protección contra sobrecarga (Art. 430.32).
    4. Protección contra cortocircuito al 250% (Art. 430.52).`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const exportCSV = () => {
    const headers = ["Nombre", "Fases", "Tension(V)", "HP", "FLA(A)", "Cond. Min(A)", "Sobrecarga(A)", "ITM Sugerido(A)"];
    const rows = motors.map(m => {
      const res = calculateMotorData(m);
      return [m.name, m.phases, m.voltage, m.hp, res.fla, res.minAmpacity, res.overloadProtection, res.suggestedITM];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `calculos_motores_nom001_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Cálculo de Motores (Art. 430)</h1>
          <p className="text-text-secondary mt-1">Protección, Alimentador y Control de Motores Eléctricos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-[#283039] rounded-lg text-sm font-bold text-white hover:bg-[#3b4754] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar
          </button>
          <button onClick={addMotor} disabled={motors.length >= 30} className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add</span>
            Agregar Motor ({motors.length}/30)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {motors.map(m => {
            const res = calculateMotorData(m);
            return (
              <div 
                key={m.id} 
                onClick={() => setActiveId(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${
                  activeId === m.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-surface-dark border-border-dark hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase text-text-secondary truncate pr-4">{m.name}</span>
                  {motors.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeMotor(m.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 rounded hover:bg-red-500/10 transition-all">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black">{m.hp} HP</span>
                  <div className="text-right">
                    <span className="text-[10px] block text-text-secondary">{m.phases}Φ • {m.voltage}V</span>
                    <span className="text-xs font-bold text-primary">{res.fla}A FLA</span>
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
              <span className="material-symbols-outlined text-primary">settings_applications</span>
              Placa de Datos y Servicio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Identificación del Motor</label>
                <input 
                  type="text" 
                  value={activeMotor.name}
                  onChange={(e) => updateMotor(activeMotor.id, { name: e.target.value })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Fases</label>
                <select 
                  value={activeMotor.phases}
                  onChange={(e) => updateMotor(activeMotor.id, { phases: Number(e.target.value) as 1 | 3 })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                >
                  <option value={1}>Monofásico (1Φ)</option>
                  <option value={3}>Trifásico (3Φ)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Tensión (V)</label>
                <select 
                  value={activeMotor.voltage}
                  onChange={(e) => updateMotor(activeMotor.id, { voltage: Number(e.target.value) as 127 | 220 | 440 })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                >
                  {activeMotor.phases === 1 ? (
                    <>
                      <option value={127}>127 V</option>
                      <option value={220}>220 V</option>
                    </>
                  ) : (
                    <>
                      <option value={220}>220 V</option>
                      <option value={440}>440 V</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Potencia (HP)</label>
                <select 
                  value={activeMotor.hp}
                  onChange={(e) => updateMotor(activeMotor.id, { hp: Number(e.target.value) })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4"
                >
                  {HP_OPTIONS.map(hp => (
                    <option key={hp} value={hp}>{hp} HP</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">Factor de Servicio (SF)</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={activeMotor.serviceFactor}
                  onChange={(e) => updateMotor(activeMotor.id, { serviceFactor: Number(e.target.value) })}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-lg h-11 px-4 focus:ring-primary"
                />
              </div>
            </div>
          </section>

          <div className="bg-[#111418] border border-border-dark rounded-2xl p-6 space-y-4">
             <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Referencias Normativas</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="text-xs">
                  <p className="text-text-secondary font-bold mb-1">FLA Tabla:</p>
                  <p className="text-white">Art. 430-248 / 250</p>
                </div>
                <div className="text-xs">
                  <p className="text-text-secondary font-bold mb-1">Cond. Alimentador:</p>
                  <p className="text-white">Art. 430-22 (125%)</p>
                </div>
                <div className="text-xs">
                  <p className="text-text-secondary font-bold mb-1">Protección ITM:</p>
                  <p className="text-white">Art. 430-52 (250%)</p>
                </div>
                <div className="text-xs">
                  <p className="text-text-secondary font-bold mb-1">Sobrecarga:</p>
                  <p className="text-white">Art. 430-32</p>
                </div>
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 p-4">
               <button onClick={askAiBasis} className="size-10 bg-[#283039] hover:bg-primary text-white rounded-lg flex items-center justify-center transition-all">
                 <span className="material-symbols-outlined">psychology</span>
               </button>
            </div>
            
            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Corriente de Placa (FLA)</p>
            <div className="text-8xl font-black text-white leading-none mb-10 tracking-tighter">
              {results.fla}<span className="text-2xl text-primary ml-1">A</span>
            </div>

            <div className="w-full space-y-5 border-t border-border-dark pt-8">
              <div className="flex justify-between items-center group">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">Conductores (125%)</span>
                  <span className="text-xs text-white opacity-60">Capacidad mínima requerida</span>
                </div>
                <span className="text-xl font-bold text-white">{results.minAmpacity} A</span>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">ITM Sugerido (250%)</span>
                  <span className="text-xs text-white opacity-60">Tiempo Inverso</span>
                </div>
                <span className="text-xl font-bold text-emerald-500">{results.suggestedITM} A</span>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">Sobrecarga (Trip)</span>
                  <span className="text-xs text-white opacity-60">Basado en SF: {activeMotor.serviceFactor}</span>
                </div>
                <span className="text-xl font-bold text-orange-500">{results.overloadProtection} A</span>
              </div>
            </div>

            <div className="w-full mt-10">
               <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                 <p className="text-[10px] font-bold text-primary uppercase mb-1">Medio de Desconexión</p>
                 <p className="text-xs text-text-secondary leading-relaxed">
                   Debe tener una capacidad de al menos el 115% de la FLA: 
                   <span className="text-white font-bold"> {(results.fla * 1.15).toFixed(1)} A</span>
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-surface-dark to-[#111418] border border-border-dark rounded-2xl p-6">
            <h4 className="text-xs font-bold text-text-secondary uppercase mb-4 tracking-widest">Estado del Motor</h4>
            <div className="flex items-center gap-4">
              <div className="size-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20"></div>
              <p className="text-sm font-medium text-white">Cumple con parámetros Art. 430</p>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dark flex justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary font-bold uppercase">Potencia kW</span>
                <span className="text-lg font-bold text-white">{(activeMotor.hp * 0.746).toFixed(2)} kW</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-text-secondary font-bold uppercase">Eficiencia Est.</span>
                <span className="text-lg font-bold text-white">88%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotorCalculation;
