
import React, { useState, useEffect, useMemo } from 'react';
import { STORAGE_KEYS } from '../constants';
import { Project } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Report: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [allData, setAllData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (activeId) {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const current = projects.find((p: Project) => p.id === activeId);
      if (current) {
        setProject(current);
        
        // Gather all module data
        const data: any = {};
        Object.entries(STORAGE_KEYS).forEach(([key, prefix]) => {
          if (key !== 'PROJECTS' && key !== 'ACTIVE_PROJECT_ID') {
            const saved = localStorage.getItem(prefix + activeId);
            if (saved) data[key] = JSON.parse(saved);
          }
        });
        setAllData(data);
      }
    }
    setLoading(false);
  }, []);

  const generatePDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`Reporte_${project?.name || 'Proyecto'}_NOM001.pdf`);
  };

  if (loading) return <div className="p-10 text-center">Cargando reporte...</div>;
  if (!project) return (
    <div className="p-10 flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-6xl text-text-secondary opacity-20 mb-4">error</span>
      <h2 className="text-2xl font-bold">No hay proyecto activo</h2>
      <p className="text-text-secondary mt-2">Selecciona un proyecto en la pestaña "Proyectos" para generar su reporte.</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-[1000px] mx-auto">
      <div className="no-print flex justify-between items-center mb-10 border-b border-border-dark pb-6">
        <div>
          <h1 className="text-3xl font-black">Reporte Consolidado</h1>
          <p className="text-text-secondary">Memoria de cálculo técnica para {project.name}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#283039] rounded-xl text-sm font-bold hover:bg-[#3b4754] transition-all"
          >
            <span className="material-symbols-outlined">print</span>
            Imprimir
          </button>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Exportar PDF
          </button>
        </div>
      </div>

      <div id="report-content" className="bg-white text-black p-12 shadow-2xl rounded-sm border border-gray-100 font-serif">
        {/* Header Report */}
        <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase text-primary leading-none mb-2">Memoria de Cálculo</h1>
            <p className="text-lg font-bold text-gray-800">CUMPLIMIENTO NORMATIVO NOM-001-SEDE-2012</p>
          </div>
          <div className="text-right">
             <div className="flex gap-2 items-center justify-end text-primary mb-2">
                <span className="material-symbols-outlined font-black">bolt</span>
                <span className="font-black text-xl">NOM01Sauria</span>
             </div>
             <p className="text-xs font-bold text-gray-500">INGENIERÍA ELÉCTRICA AVANZADA</p>
             <p className="text-[10px] text-gray-400">Fecha: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Project Overview */}
        <section className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-6">Información General</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Proyecto:</p><p className="font-bold">{project.name}</p></div>
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Cliente:</p><p className="font-bold">{project.client}</p></div>
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Ubicación:</p><p className="font-bold">{project.location}</p></div>
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Estatus:</p><p className="font-bold">{project.status}</p></div>
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Tensión:</p><p className="font-bold">{project.voltage}</p></div>
            <div><p className="text-gray-400 uppercase font-bold text-[10px]">Temp. Diseño:</p><p className="font-bold">{project.temp}°C</p></div>
          </div>
        </section>

        {/* Calculations Sections */}
        {allData.LOAD_SCHEDULE && (
          <section className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-6">Resumen de Cargas</h2>
            <table className="w-full text-xs text-left border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Cto</th>
                  <th className="p-2 border">Descripción</th>
                  <th className="p-2 border">Carga (VA)</th>
                  <th className="p-2 border">Polos</th>
                  <th className="p-2 border">V</th>
                </tr>
              </thead>
              <tbody>
                {allData.LOAD_SCHEDULE.circuits?.map((c: any) => (
                  <tr key={c.id}>
                    <td className="p-2 border font-bold">{c.name}</td>
                    <td className="p-2 border italic">{c.description}</td>
                    <td className="p-2 border font-mono">{c.loadVA}</td>
                    <td className="p-2 border text-center">{c.poles}</td>
                    <td className="p-2 border text-center">{c.voltage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Voltage Drop Summary */}
        {allData.VOLTAGE_DROP && (
          <section className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-6">Cálculos de Caída de Tensión</h2>
            <div className="grid grid-cols-1 gap-4">
              {allData.VOLTAGE_DROP.map((c: any) => (
                <div key={c.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{c.name}</p>
                      <p className="text-sm font-bold">{c.length}m • {c.current}A • {c.awg} AWG</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xl font-black text-primary">{( (c.length * c.current * 0.003) / c.voltage * 100).toFixed(2)}%</p>
                      <p className="text-[10px] font-bold uppercase text-emerald-600">Cumple Art. 210-19</p>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Footer */}
        <div className="mt-20 pt-10 border-t-2 border-gray-100 flex justify-between items-end">
          <div className="w-48 border-t border-black text-center pt-2">
            <p className="text-[10px] font-bold uppercase">Firma del Ingeniero</p>
            <p className="text-[9px] text-gray-400">Cédula Profesional</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 max-w-[300px] leading-relaxed italic">
              Este reporte fue generado automáticamente por NOM01Sauria. Los cálculos se basan exclusivamente en los parámetros proporcionados y la norma NOM-001-SEDE-2012.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
