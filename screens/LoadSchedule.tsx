
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TABLE_8_CONDUCTORS } from '../constants';

interface CircuitLoad {
  id: string;
  name: string;
  description: string;
  loadVA: number;
  poles: 1 | 2 | 3;
  voltage: 127 | 220 | 440;
  phaseA: boolean;
  phaseB: boolean;
  phaseC: boolean;
}

interface LoadScheduleProject {
  id: string;
  projectName: string;
  circuits: CircuitLoad[];
  demandFactor: number;
  systemVoltage: number;
  lastModified: number;
}

const STANDARD_BREAKERS = [15, 20, 30, 40, 50, 60, 70, 80, 100, 110, 125, 150, 175, 200];
const STORAGE_KEY = 'nom01_load_schedule_projects';

const LoadSchedule: React.FC = () => {
  // Project Management State
  const [projects, setProjects] = useState<LoadScheduleProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Current Working Project State (Syncs with projects list)
  const [circuits, setCircuits] = useState<CircuitLoad[]>([
    { id: '1', name: 'C-1', description: 'Alumbrado Planta Baja', loadVA: 1200, poles: 1, voltage: 127, phaseA: true, phaseB: false, phaseC: false },
  ]);
  const [demandFactor, setDemandFactor] = useState(0.9);
  const [systemVoltage, setSystemVoltage] = useState(220);
  const [projectName, setProjectName] = useState('Tablero de Distribución Principal');

  // Load projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        if (parsed.length > 0) {
          loadProject(parsed[0]);
        }
      } catch (e) {
        console.error("Error loading projects", e);
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  const saveAllToStorage = (updatedProjects: LoadScheduleProject[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  const loadProject = (proj: LoadScheduleProject) => {
    setCurrentProjectId(proj.id);
    setProjectName(proj.projectName);
    setCircuits(proj.circuits);
    setDemandFactor(proj.demandFactor);
    setSystemVoltage(proj.systemVoltage);
  };

  const saveCurrentProject = () => {
    const projectData: LoadScheduleProject = {
      id: currentProjectId || Math.random().toString(36).substr(2, 9),
      projectName,
      circuits,
      demandFactor,
      systemVoltage,
      lastModified: Date.now(),
    };

    let updatedProjects: LoadScheduleProject[];
    if (currentProjectId) {
      updatedProjects = projects.map(p => p.id === currentProjectId ? projectData : p);
    } else {
      updatedProjects = [...projects, projectData];
      setCurrentProjectId(projectData.id);
    }
    
    setProjects(updatedProjects);
    saveAllToStorage(updatedProjects);
  };

  const createNewProject = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newProj: LoadScheduleProject = {
      id: newId,
      projectName: 'Nuevo Proyecto ' + (projects.length + 1),
      circuits: [{ id: '1', name: 'C-1', description: 'Nueva Carga', loadVA: 0, poles: 1, voltage: 127, phaseA: true, phaseB: false, phaseC: false }],
      demandFactor: 0.9,
      systemVoltage: 220,
      lastModified: Date.now()
    };
    
    const updated = [...projects, newProj];
    setProjects(updated);
    loadProject(newProj);
    saveAllToStorage(updated);
  };

  const deleteProject = (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveAllToStorage(updated);
    if (currentProjectId === id) {
      if (updated.length > 0) {
        loadProject(updated[0]);
      } else {
        // Reset to initial state if no projects left
        setCurrentProjectId(null);
        setProjectName('Nuevo Proyecto');
        setCircuits([{ id: '1', name: 'C-1', description: 'Nueva Carga', loadVA: 0, poles: 1, voltage: 127, phaseA: true, phaseB: false, phaseC: false }]);
      }
    }
  };

  // Calculation Logic
  const addCircuit = () => {
    if (circuits.length >= 30) return;
    const nextNum = circuits.length + 1;
    const newId = Math.random().toString(36).substr(2, 9);
    setCircuits([...circuits, {
      id: newId,
      name: `C-${nextNum}`,
      description: 'Nueva Carga',
      loadVA: 0,
      poles: 1,
      voltage: 127,
      phaseA: true,
      phaseB: false,
      phaseC: false
    }]);
  };

  const updateCircuit = (id: string, updates: Partial<CircuitLoad>) => {
    setCircuits(circuits.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCircuit = (id: string) => {
    if (circuits.length <= 1) return;
    setCircuits(circuits.filter(c => c.id !== id));
  };

  const processedData = useMemo(() => {
    return circuits.map(c => {
      const activePhasesCount = [c.phaseA, c.phaseB, c.phaseC].filter(Boolean).length;
      const denominator = c.voltage * (c.poles === 3 ? Math.sqrt(3) : 1);
      const amps = activePhasesCount > 0 ? c.loadVA / denominator : 0;
      const minAmpacity = amps * 1.25;
      const conductor = TABLE_8_CONDUCTORS.find(t => t.ampacity_75c >= minAmpacity) || TABLE_8_CONDUCTORS[TABLE_8_CONDUCTORS.length - 1];
      const protection = STANDARD_BREAKERS.find(b => b >= minAmpacity) || 15;
      const totalAreaMM2 = (conductor.area_mm2 * (c.poles + 1)) * 1.8;
      let conduit = '13 (1/2")';
      if (totalAreaMM2 > 78) conduit = '19 (3/4")';
      if (totalAreaMM2 > 137) conduit = '25 (1")';

      return {
        ...c,
        amps: Number(amps.toFixed(2)),
        conductor: `${conductor.awg} AWG`,
        protection: `${c.poles}x${protection}A`,
        conduit,
        shareVA: activePhasesCount > 0 ? c.loadVA / activePhasesCount : 0
      };
    });
  }, [circuits]);

  const totals = useMemo(() => {
    let totalA = 0, totalB = 0, totalC = 0;
    processedData.forEach(c => {
      if (c.phaseA) totalA += c.shareVA;
      if (c.phaseB) totalB += c.shareVA;
      if (c.phaseC) totalC += c.shareVA;
    });

    const connectedLoad = totalA + totalB + totalC;
    const demandedLoad = connectedLoad * demandFactor;
    const avg = connectedLoad / 3;
    const maxP = Math.max(totalA, totalB, totalC);
    const minP = Math.min(totalA, totalB, totalC);
    const unbalance = avg > 0 ? ((maxP - minP) / avg) * 100 : 0;

    return {
      totalA: Math.round(totalA),
      totalB: Math.round(totalB),
      totalC: Math.round(totalC),
      connectedLoad: Math.round(connectedLoad),
      demandedLoad: Math.round(demandedLoad),
      unbalance: Number(unbalance.toFixed(2)),
      mainAmps: Number((demandedLoad / (systemVoltage * Math.sqrt(3))).toFixed(2))
    };
  }, [processedData, demandFactor, systemVoltage]);

  return (
    <div className="p-6 lg:p-10 max-w-[1700px] mx-auto flex flex-col gap-6">
      {/* Project Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111418] border border-border-dark p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined">folder_managed</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 group">
              {isEditingName ? (
                <input
                  autoFocus
                  className="bg-[#1c2127] border-primary text-white text-lg font-black px-2 py-1 rounded w-full max-w-md focus:ring-1 focus:ring-primary outline-none"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => { setIsEditingName(false); saveCurrentProject(); }}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                />
              ) : (
                <>
                  <h2 className="text-lg font-black text-white">{projectName}</h2>
                  <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">
              ID: {currentProjectId || 'Temporal'} • Proyectos Guardados: {projects.length}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative group">
            <button className="px-4 py-2.5 bg-[#1c2127] border border-border-dark rounded-xl text-xs font-bold text-white hover:bg-[#283039] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">list</span>
              Mis Proyectos
            </button>
            <div className="absolute right-0 top-full mt-2 w-72 bg-surface-dark border border-border-dark rounded-xl shadow-2xl invisible group-hover:visible z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-border-dark bg-[#111418] text-[10px] font-black text-text-secondary uppercase">
                Seleccionar Cuadro
              </div>
              <div className="max-h-60 overflow-y-auto">
                {projects.length === 0 && <div className="p-4 text-xs text-text-secondary italic">No hay proyectos guardados.</div>}
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer group/item border-b border-border-dark last:border-0" onClick={() => loadProject(p)}>
                    <div className="flex-1 truncate pr-4">
                      <p className={`text-xs font-bold truncate ${currentProjectId === p.id ? 'text-primary' : 'text-white'}`}>{p.projectName}</p>
                      <p className="text-[9px] text-text-secondary">Modificado: {new Date(p.lastModified).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                      className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={createNewProject} className="px-4 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add_box</span>
            Nuevo
          </button>
          <button onClick={saveCurrentProject} className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">save</span>
            Guardar
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Cédula de Cargas Profesional</h1>
          <p className="text-text-secondary mt-1">Balanceo de Fases y Dimensionamiento Propuesto (Art. 210, 220, 240).</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-[#283039] rounded-lg text-xs font-bold text-white hover:bg-[#3b4754] transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">print</span>
            Imprimir
          </button>
          <button onClick={addCircuit} disabled={circuits.length >= 30} className="px-4 py-2 bg-primary rounded-lg text-xs font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add_task</span>
            Agregar Cto ({circuits.length}/30)
          </button>
        </div>
      </div>

      {/* Main Table Content (Existing logic, but integrated) */}
      <div className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-[#111418] text-text-secondary font-bold uppercase tracking-wider">
                <th className="px-3 py-4 w-16 border-r border-border-dark text-center">Cto</th>
                <th className="px-4 py-4 min-w-[220px] border-r border-border-dark">Descripción de Carga</th>
                <th className="px-3 py-4 w-16 border-r border-border-dark text-center">Polos</th>
                <th className="px-3 py-4 w-20 border-r border-border-dark text-center">Tensión</th>
                <th className="px-4 py-4 w-24 border-r border-border-dark text-right text-primary">Watts/VA</th>
                <th className="px-3 py-4 w-24 border-r border-border-dark text-center bg-blue-500/5">Fase A</th>
                <th className="px-3 py-4 w-24 border-r border-border-dark text-center bg-emerald-500/5">Fase B</th>
                <th className="px-3 py-4 w-24 border-r border-border-dark text-center bg-orange-500/5">Fase C</th>
                <th className="px-3 py-4 w-20 border-r border-border-dark text-right">Amps</th>
                <th className="px-3 py-4 w-28 border-r border-border-dark text-center text-primary bg-primary/5">Cond. Propuesto</th>
                <th className="px-3 py-4 w-24 border-r border-border-dark text-center text-orange-400 bg-orange-400/5">Prot. Sugerida</th>
                <th className="px-3 py-4 w-24 text-center bg-gray-500/5">Canalización</th>
                <th className="px-2 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {processedData.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-3 py-2 border-r border-border-dark font-black text-center text-primary bg-[#111418]/30">
                    <input 
                      type="text" 
                      value={c.name} 
                      onChange={(e) => updateCircuit(c.id, { name: e.target.value })}
                      className="w-full bg-transparent border-none p-1 font-black text-center focus:ring-0" 
                    />
                  </td>
                  <td className="px-4 py-2 border-r border-border-dark">
                    <input 
                      type="text" 
                      value={c.description} 
                      onChange={(e) => updateCircuit(c.id, { description: e.target.value })}
                      className="w-full bg-transparent border-none p-1 text-white focus:ring-0 italic" 
                      placeholder="Ej: Alumbrado..."
                    />
                  </td>
                  <td className="px-3 py-2 border-r border-border-dark text-center">
                    <select 
                      value={c.poles}
                      onChange={(e) => updateCircuit(c.id, { poles: Number(e.target.value) as 1|2|3 })}
                      className="bg-transparent border-none text-white focus:ring-0 text-center w-full appearance-none font-bold"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border-r border-border-dark text-center">
                    <select 
                      value={c.voltage}
                      onChange={(e) => updateCircuit(c.id, { voltage: Number(e.target.value) as 127|220|440 })}
                      className="bg-transparent border-none text-text-secondary focus:ring-0 text-center w-full appearance-none"
                    >
                      <option value={127}>127</option>
                      <option value={220}>220</option>
                      <option value={440}>440</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border-r border-border-dark">
                    <input 
                      type="number" 
                      value={c.loadVA} 
                      onChange={(e) => updateCircuit(c.id, { loadVA: Number(e.target.value) })}
                      className="w-full bg-[#11161c] border-border-dark rounded p-1.5 text-right font-mono text-white focus:ring-primary font-bold" 
                    />
                  </td>
                  {['A', 'B', 'C'].map((p) => {
                    const field = `phase${p}` as 'phaseA' | 'phaseB' | 'phaseC';
                    const isActive = c[field];
                    return (
                      <td 
                        key={p} 
                        onClick={() => updateCircuit(c.id, { [field]: !isActive })}
                        className={`px-3 py-2 border-r border-border-dark text-center cursor-pointer transition-all ${isActive ? 'bg-primary/20 font-black text-white' : 'text-text-secondary/10'}`}
                      >
                        {isActive ? c.shareVA.toLocaleString() : '---'}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 border-r border-border-dark text-right font-mono text-text-secondary">
                    {c.amps}
                  </td>
                  <td className="px-3 py-2 border-r border-border-dark text-center font-black text-primary bg-primary/5">
                    {c.conductor}
                  </td>
                  <td className="px-3 py-2 border-r border-border-dark text-center font-black text-orange-400 bg-orange-400/5">
                    {c.protection}
                  </td>
                  <td className="px-3 py-2 text-center text-text-secondary italic">
                    {c.conduit}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => removeCircuit(c.id)} className="text-red-500/20 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#111418] font-black text-white text-[12px]">
              <tr>
                <td colSpan={4} className="px-4 py-5 text-right border-r border-border-dark uppercase tracking-widest text-[10px] text-text-secondary">Totales Conectados (VA)</td>
                <td className="px-4 py-5 border-r border-border-dark text-right text-primary text-lg">{totals.connectedLoad.toLocaleString()}</td>
                <td className="px-3 py-5 border-r border-border-dark text-center bg-blue-500/10 text-blue-400">{totals.totalA.toLocaleString()}</td>
                <td className="px-3 py-5 border-r border-border-dark text-center bg-emerald-500/10 text-emerald-400">{totals.totalB.toLocaleString()}</td>
                <td className="px-3 py-5 border-r border-border-dark text-center bg-orange-500/10 text-orange-400">{totals.totalC.toLocaleString()}</td>
                <td colSpan={5} className="px-4 py-5 text-right">
                  <div className="flex justify-end items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-text-secondary uppercase">Desequilibrio</span>
                      <span className={`text-xl ${totals.unbalance > 5 ? 'text-red-500' : 'text-emerald-500'}`}>{totals.unbalance}%</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Demand and Graphic areas remain identical but use dynamic project state */}
        <div className="bg-surface-dark border border-border-dark rounded-2xl p-8 shadow-xl flex flex-col justify-between">
           <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-6">Cálculo de Demanda</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-white uppercase">Factor de Demanda</label>
                  <input 
                    type="number" 
                    step="0.05"
                    max="1"
                    min="0"
                    value={demandFactor} 
                    onChange={(e) => setDemandFactor(Number(e.target.value))}
                    className="w-24 bg-[#11161c] border-border-dark rounded-lg p-2 text-right text-lg text-primary font-black"
                  />
                </div>
                <div className="pt-6 border-t border-border-dark space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-text-secondary font-bold uppercase">Carga Demandada</span>
                    <span className="text-3xl font-black text-white">{totals.demandedLoad.toLocaleString()} <span className="text-sm text-primary">VA</span></span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-text-secondary font-bold uppercase">Corriente x Fase (I)</span>
                    <span className="text-xl font-black text-emerald-500">{totals.mainAmps} <span className="text-xs">Amps</span></span>
                  </div>
                </div>
              </div>
           </div>
           <button onClick={() => window.dispatchEvent(new CustomEvent('nom-ai-query', { detail: `Analiza el proyecto ${projectName}. Carga ${totals.connectedLoad}VA, Desequilibrio ${totals.unbalance}%` }))} className="w-full mt-8 py-3 bg-primary/10 border border-primary/20 hover:border-primary text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">analytics</span>
              Generar Análisis AI
           </button>
        </div>

        <div className="xl:col-span-2 bg-surface-dark border border-border-dark rounded-2xl p-8 shadow-xl">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Distribución Gráfica de Cargas</h3>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] text-text-secondary font-bold">Fase A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] text-text-secondary font-bold">Fase B</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-orange-500 rounded-full"></div>
                  <span className="text-[10px] text-text-secondary font-bold">Fase C</span>
                </div>
             </div>
           </div>
           
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { phase: 'Fase A', va: totals.totalA },
                  { phase: 'Fase B', va: totals.totalB },
                  { phase: 'Fase C', va: totals.totalC },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#283039" vertical={false} />
                  <XAxis dataKey="phase" stroke="#9dabb9" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111418', border: '1px solid #283039', borderRadius: '12px', fontSize: '11px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="va" radius={[6, 6, 0, 0]}>
                    {[
                      { name: 'A', color: '#3b82f6' },
                      { name: 'B', color: '#10b981' },
                      { name: 'C', color: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="grid grid-cols-3 gap-6 mt-6">
              {[
                { label: 'Carga A', val: totals.totalA, color: 'text-blue-500' },
                { label: 'Carga B', val: totals.totalB, color: 'text-emerald-500' },
                { label: 'Carga C', val: totals.totalC, color: 'text-orange-500' }
              ].map(stat => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-[#111418]/50 border border-border-dark">
                  <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.color}`}>{((stat.val / (totals.connectedLoad || 1)) * 100).toFixed(1)}%</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoadSchedule;
