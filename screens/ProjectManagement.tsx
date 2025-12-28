
import React, { useState, useEffect } from 'react';
import { Project } from '../types';

const STORAGE_KEY = 'nom01_global_projects';
const ACTIVE_PROJECT_KEY = 'nom01_active_project_id';

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    client: '',
    location: '',
    status: 'In Progress',
    voltage: '220/127V',
    temp: 35
  });

  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
    if (savedActiveId) {
      setActiveProjectId(savedActiveId);
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedProjects: Project[];

    if (editingProject) {
      updatedProjects = projects.map(p => 
        p.id === editingProject.id 
          ? { ...editingProject, ...formData, lastModified: Date.now() } as Project 
          : p
      );
    } else {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Nuevo Proyecto',
        client: formData.client || 'Sin Cliente',
        location: formData.location || 'N/A',
        status: formData.status as any || 'In Progress',
        voltage: formData.voltage || '220/127V',
        temp: formData.temp || 35,
        lastModified: Date.now()
      };
      updatedProjects = [...projects, newProject];
      if (!activeProjectId) {
        selectProject(newProject.id);
      }
    }

    saveProjects(updatedProjects);
    closeModal();
  };

  const deleteProject = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este proyecto y todos sus datos asociados?')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      if (activeProjectId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        selectProject(nextId);
      }
    }
  };

  const selectProject = (id: string | null) => {
    setActiveProjectId(id);
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  };

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData(project);
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        client: '',
        location: '',
        status: 'In Progress',
        voltage: '220/127V',
        temp: 35
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Administración de Proyectos</h1>
          <p className="text-text-secondary mt-1">Gestiona la base de datos de tus memorias de cálculo.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary rounded-lg text-sm font-bold text-white hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Nuevo Proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-dark border border-dashed border-border-dark rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-20">folder_off</span>
          <h3 className="text-xl font-bold text-white">No hay proyectos registrados</h3>
          <p className="text-text-secondary mt-2 max-w-xs">Crea tu primer proyecto para empezar a realizar cálculos normativos.</p>
          <button 
            onClick={() => openModal()}
            className="mt-6 text-primary font-bold hover:underline"
          >
            Comenzar ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`relative group bg-surface-dark border-2 rounded-2xl p-6 transition-all hover:shadow-xl ${
                activeProjectId === project.id 
                  ? 'border-primary shadow-primary/5 ring-1 ring-primary' 
                  : 'border-border-dark hover:border-gray-500'
              }`}
            >
              {activeProjectId === project.id && (
                <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  Activo
                </div>
              )}
              
              <div className="mb-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset mb-2 ${
                  project.status === 'Approved' ? 'bg-green-500/10 text-green-500 ring-green-500/20' : 
                  project.status === 'Review' ? 'bg-orange-500/10 text-orange-500 ring-orange-500/20' : 
                  'bg-blue-500/10 text-blue-500 ring-blue-500/20'
                }`}>
                  {project.status}
                </span>
                <h3 className="text-lg font-black text-white truncate pr-12">{project.name}</h3>
                <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {project.client}
                </p>
              </div>

              <div className="space-y-2 mb-6 border-t border-border-dark pt-4">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary uppercase font-bold tracking-tighter">Ubicación</span>
                  <span className="text-white truncate max-w-[120px]">{project.location}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary uppercase font-bold tracking-tighter">Tensión</span>
                  <span className="text-white font-mono">{project.voltage}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary uppercase font-bold tracking-tighter">Temp. Amb.</span>
                  <span className="text-white">{project.temp}°C</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => selectProject(project.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeProjectId === project.id 
                      ? 'bg-primary/20 text-primary cursor-default' 
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {activeProjectId === project.id ? 'Seleccionado' : 'Seleccionar'}
                </button>
                <button 
                  onClick={() => openModal(project)}
                  className="px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-border-dark w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-[#111418] border-b border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-black text-white">
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <button onClick={closeModal} className="text-text-secondary hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Nombre del Proyecto</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-12 px-4 focus:ring-primary focus:border-primary"
                  placeholder="Ej: Planta Industrial Norte"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Cliente</label>
                  <input 
                    type="text" 
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-11 px-4 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Estatus</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-11 px-4 text-sm"
                  >
                    <option value="In Progress">En Progreso</option>
                    <option value="Review">En Revisión</option>
                    <option value="Approved">Aprobado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Ubicación</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-11 px-4 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Tensión Sistema</label>
                  <input 
                    type="text" 
                    value={formData.voltage}
                    onChange={(e) => setFormData({...formData, voltage: e.target.value})}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-11 px-4 text-sm font-mono"
                    placeholder="Ej: 220/127V"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase mb-1 block">Temp. Amb (°C)</label>
                  <input 
                    type="number" 
                    value={formData.temp}
                    onChange={(e) => setFormData({...formData, temp: Number(e.target.value)})}
                    className="w-full bg-[#11161c] border-border-dark text-white rounded-xl h-11 px-4 text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 border border-border-dark text-text-secondary font-bold rounded-xl hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                >
                  {editingProject ? 'Actualizar' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
