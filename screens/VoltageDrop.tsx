
import React, { useState, useMemo } from 'react';
import { TABLE_8_CONDUCTORS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CircuitFeed {
  id: string;
  name: string;
  length: number;
  current: number;
  voltage: number;
  awg: string;
  isThreePhase: boolean;
}

const VoltageDrop: React.FC = () => {
  const [circuits, setCircuits] = useState<CircuitFeed[]>([
    { id: '1', name: 'Alimentador Gral', length: 75, current: 120, voltage: 480, awg: '1/0', isThreePhase: true }
  ]);
  const [activeCircuitId, setActiveCircuitId] = useState<string>('1');

  const activeCircuit = useMemo(() => 
    circuits.find(c => c.id === activeCircuitId) || circuits[0], 
  [circuits, activeCircuitId]);

  const addCircuit = () => {
    if (circuits.length >= 30) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setCircuits([...circuits, { 
      id: newId, 
      name: `Circuito ${circuits.length + 1}`, 
      length: 30, 
      current: 20, 
      voltage: 220, 
      awg: '12', 
      isThreePhase: false 
    }]);
    setActiveCircuitId(newId);
  };

  const removeCircuit = (id: string) => {
    if (circuits.length <= 1) return;
    const newCircuits = circuits.filter(c => c.id !== id);
    setCircuits(newCircuits);
    if (activeCircuitId === id) setActiveCircuitId(newCircuits[0].id);
  };

  const updateCircuit = (id: string, updates: Partial<CircuitFeed>) => {
    setCircuits(circuits.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const calculateVD = (c: CircuitFeed) => {
    const conductor = TABLE_8_CONDUCTORS.find(t => t.awg === c.awg);
    if (!conductor) return { vd: 0, pct: 0 };
    const factor = c.isThreePhase ? Math.sqrt(3) : 2;
    const pf = 0.9;
    const sinPhi = 0.436; // Approx for 0.9 PF
    const vd = (factor * c.length * c.current * (conductor.resistance_copper * pf + conductor.reactance_steel * sinPhi)) / 1000;
    const pct = (vd / c.voltage) * 100;
    return { vd: vd.toFixed(2), pct: pct.toFixed(2) };
  };

  const activeResults = useMemo(() => calculateVD(activeCircuit), [activeCircuit]);

  const chartData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const iterCurrent = (activeCircuit.current / 2) + (i * (activeCircuit.current / 10));
      const conductor = TABLE_8_CONDUCTORS.find(c => c.awg === activeCircuit.awg);
      const factor = activeCircuit.isThreePhase ? Math.sqrt(3) : 2;
      const iterVd = (factor * activeCircuit.length * iterCurrent * (conductor!.resistance_copper * 0.9 + conductor!.reactance_steel * 0.436)) / 1000;
      return {
        current: Math.round(iterCurrent),
        drop: Number(((iterVd / activeCircuit.voltage) * 100).toFixed(2))
      };
    });
  }, [activeCircuit]);

  const askAiBasis = () => {
    const prompt = `Explica el fundamento normativo para el circuito '${activeCircuit.name}' con una caída del ${activeResults.pct}%. Cita Art. 210-19(a) de la NOM-001-SEDE-2012.`;
    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: prompt }));
  };

  const shareResults = () => {
    const compliance = Number(activeResults.pct) <= 3 ? "CUMPLE" : "NO CUMPLE";
    const reportPrompt = `Genera un informe técnico corto y profesional para el siguiente circuito eléctrico. Formatea la respuesta con una estructura clara (Datos, Resultados, Conclusión Normativa).
    
Detalles del Circuito:
- Nombre: ${activeCircuit.name}
- Longitud: ${activeCircuit.length} m
- Corriente: ${activeCircuit.current} A
- Tensión Nominal: ${activeCircuit.voltage} V
- Conductor: ${activeCircuit.awg} AWG (${activeCircuit.isThreePhase ? 'Trifásico' : 'Monofásico'})
- Caída de Tensión Calculada: ${activeResults.pct} %
- Tensión en el Receptor: ${(activeCircuit.voltage - Number(activeResults.vd)).toFixed(1)} V
- Estatus NOM-001-SEDE-2012: ${compliance}

Por favor, añade recomendaciones técnicas si es necesario.`;

    window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: reportPrompt }));
  };

  const exportToCSV = () => {
    const headers = ["Nombre", "Longitud(m)", "Corriente(A)", "Tension(V)", "Conductor(AWG)", "Sistema", "Caida(V)", "Caida(%)", "Cumplimiento"];
    const rows = circuits.map(c => {
      const res = calculateVD(c);
      const compliance = Number(res.pct) <= 3 ? "CUMPLE" : "NO CUMPLE";
      return [
        c.name,
        c.length,
        c.current,
        c.voltage,
        c.awg,
        c.isThreePhase ? "Trifasico" : "Monofasico",
        res.vd,
        res.pct,
        compliance
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `calculos_caida_tension_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Caída de Tensión Multinivel</h1>
          <p className="text-text-secondary mt-1">Gestión de hasta 30 circuitos independientes.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#283039] rounded-lg text-sm font-bold text-white hover:bg-[#3b4754] transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar CSV
          </button>
          <button 
            onClick={addCircuit}
            disabled={circuits.length >= 30}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Circuito ({circuits.length}/30)
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar de Circuitos */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {circuits.map((c) => {
            const res = calculateVD(c);
            const isCritical = Number(res.pct) > 3;
            return (
              <div 
                key={c.id}
                onClick={() => setActiveCircuitId(c.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative group ${
                  activeCircuitId === c.id 
                    ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                    : 'bg-surface-dark border-border-dark hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-tighter text-text-secondary truncate pr-4">{c.name}</span>
                  {circuits.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeCircuit(c.id); }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <span className={`text-xl font-black ${isCritical ? 'text-red-500' : 'text-emerald-500'}`}>{res.pct}%</span>
                  <span className="text-[10px] text-text-secondary">{c.awg} AWG • {c.length}m</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de Configuración Activa */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-dark rounded-2xl p-8 border border-border-dark shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Configuración: {activeCircuit.name}
              </div>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Nombre del Circuito</label>
                <input 
                  type="text" 
                  value={activeCircuit.name} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { name: e.target.value })}
                  className="rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm focus:ring-primary focus:border-primary" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Longitud (m)</label>
                <input 
                  type="number" 
                  value={activeCircuit.length} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { length: Number(e.target.value) })}
                  className="rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Corriente (A)</label>
                <input 
                  type="number" 
                  value={activeCircuit.current} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { current: Number(e.target.value) })}
                  className="rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Tensión (V)</label>
                <select 
                  value={activeCircuit.voltage} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { voltage: Number(e.target.value) })}
                  className="rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm"
                >
                  <option value={127}>127V</option>
                  <option value={220}>220V</option>
                  <option value={440}>440V</option>
                  <option value={480}>480V</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Conductor (AWG)</label>
                <select 
                  value={activeCircuit.awg} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { awg: e.target.value })}
                  className="rounded-lg bg-[#11161c] border-border-dark text-white h-10 px-3 text-sm"
                >
                  {TABLE_8_CONDUCTORS.map(c => <option key={c.awg} value={c.awg}>{c.awg}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeCircuit.isThreePhase} 
                  onChange={(e) => updateCircuit(activeCircuit.id, { isThreePhase: e.target.checked })}
                  className="rounded border-border-dark bg-[#11161c] text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-white uppercase">Sistema Trifásico</span>
              </label>
            </div>
          </section>

          <section className="bg-surface-dark rounded-2xl p-6 border border-border-dark shadow-sm h-48">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase mb-2 tracking-widest">Gráfico de Caída (%)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#283039" />
                <XAxis dataKey="current" stroke="#9dabb9" fontSize={10} />
                <YAxis stroke="#9dabb9" fontSize={10} unit="%" />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1c2127', border: '1px solid #283039', borderRadius: '8px', fontSize: '10px' }}
                   itemStyle={{ color: '#137fec' }}
                />
                <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="drop" stroke="#137fec" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-dark rounded-2xl p-8 border border-border-dark relative overflow-hidden flex-1 flex flex-col justify-center shadow-lg">
            <div className={`absolute top-0 left-0 w-2 h-full ${Number(activeResults.pct) > 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold">Estatus Circuito</h3>
               <button 
                onClick={shareResults}
                className="size-10 bg-[#283039] hover:bg-primary text-white rounded-lg flex items-center justify-center transition-all shadow-md group"
                title="Generar Informe AI"
               >
                 <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">share</span>
               </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Caída de Tensión</p>
                <span className={`text-6xl font-black ${Number(activeResults.pct) > 3 ? 'text-red-500' : 'text-emerald-500'}`}>{activeResults.pct} %</span>
              </div>
              <div className="p-4 rounded-xl bg-[#111418] border border-border-dark">
                 <p className="text-[10px] font-bold text-primary uppercase mb-1 tracking-tighter">Conformidad NOM-001</p>
                 <p className="text-xs font-medium leading-relaxed mb-3">
                  {Number(activeResults.pct) <= 3 
                    ? "El diseño CUMPLE con los parámetros recomendados del Art. 210-19." 
                    : "EXCEDE el límite del 3%. Riesgo de ineficiencia y calentamiento."}
                 </p>
                 <button 
                  onClick={askAiBasis}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-blue-400 transition-colors uppercase"
                 >
                   <span className="material-symbols-outlined text-sm">library_books</span>
                   Consultar experto AI
                 </button>
              </div>
              <div className="flex justify-between items-center text-xs font-bold pt-4 border-t border-border-dark">
                 <span className="text-text-secondary uppercase">Tensión Final:</span>
                 <span className="text-white">{(activeCircuit.voltage - Number(activeResults.vd)).toFixed(1)} V</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoltageDrop;
