
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto flex flex-col gap-8">
      <div className="flex flex-wrap justify-between gap-6 items-end">
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-bold leading-tight">Bienvenido, Ingeniero</p>
          <p className="text-text-secondary text-base font-normal">Gestión centralizada de integridad normativa NOM-001-SEDE-2012.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/config" className="flex items-center gap-2 px-5 py-2.5 bg-primary rounded-lg text-sm font-semibold text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Proyecto
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[#e5e7eb] dark:border-[#3b4754] bg-gradient-to-br from-white to-[#f9fafb] dark:from-[#1a222c] dark:to-[#111418] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-40 h-40 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex flex-col h-full justify-between gap-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold mb-2">Herramientas Rápidas</h3>
              <p className="text-text-secondary text-sm max-w-lg">Inicia un nuevo diseño o accede a los módulos de cálculo de cumplimiento normativo.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Caída de Tensión', icon: 'bolt', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', path: '/voltage-drop' },
                { label: 'Tubería', icon: 'straighten', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', path: '/conduit' },
                { label: 'Protecciones', icon: 'shield', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', path: '/protection' },
                { label: 'Ampacidad', icon: 'table_view', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/conductor' },
              ].map((tool) => (
                <Link key={tool.path} to={tool.path} className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-[#e5e7eb] dark:border-[#3b4754] bg-white dark:bg-[#283039] hover:border-primary hover:shadow-md transition-all group/btn">
                  <div className={`p-3 rounded-full ${tool.color} group-hover/btn:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-center">{tool.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] dark:border-[#3b4754] bg-white dark:bg-[#1a222c] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">Estado del Sistema</h3>
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-500 ring-1 ring-inset ring-green-600/20">Online</span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-text-secondary">Sincronización Normativa</span>
                  <span className="font-bold">98%</span>
                </div>
                <div className="w-full bg-[#e5e7eb] dark:bg-[#283039] rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "98%" }}></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#283039] border border-gray-100 dark:border-border-dark">
                <p className="text-xs font-bold text-primary uppercase mb-1">Última Actualización</p>
                <p className="text-sm font-medium">Tabla 310-15(b)(16) - Rev: 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">Proyectos Recientes</h3>
        <div className="rounded-2xl border border-[#e5e7eb] dark:border-[#3b4754] bg-white dark:bg-[#1a222c] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] dark:bg-[#283039] text-xs uppercase font-bold text-text-secondary">
                <tr>
                  <th className="px-8 py-5">Nombre del Proyecto</th>
                  <th className="px-8 py-5">Ubicación</th>
                  <th className="px-8 py-5">Estado</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#3b4754]">
                {[
                  { name: 'Nave Industrial Beta', id: 'PRJ-2023-045', loc: 'Monterrey, NL', status: 'In Progress', icon: 'factory' },
                  { name: 'Residencial Las Lomas', id: 'PRJ-2023-042', loc: 'CDMX, Centro', status: 'Approved', icon: 'apartment' },
                  { name: 'Subestación S-40', id: 'PRJ-2024-001', loc: 'Querétaro, QRO', status: 'Review', icon: 'bolt' },
                ].map((prj) => (
                  <tr key={prj.id} className="hover:bg-[#f9fafb] dark:hover:bg-[#212b36] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-[#283039] text-text-secondary group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">{prj.icon}</span>
                        </div>
                        <div>
                          <div className="font-bold text-base">{prj.name}</div>
                          <div className="text-xs text-text-secondary">ID: {prj.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-text-secondary font-medium">{prj.loc}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                        prj.status === 'Approved' 
                          ? 'bg-green-500/10 text-green-600 ring-green-500/20' 
                          : prj.status === 'Review' 
                            ? 'bg-orange-500/10 text-orange-600 ring-orange-500/20'
                            : 'bg-blue-500/10 text-blue-600 ring-blue-500/20'
                      }`}>
                        <span className={`size-1.5 rounded-full ${prj.status === 'Approved' ? 'bg-green-500' : prj.status === 'Review' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                        {prj.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link to="/schedule" className="text-primary hover:underline font-bold text-sm">Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
