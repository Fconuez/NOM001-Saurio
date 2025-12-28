
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark text-[#111418] dark:text-white">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex flex-col w-[280px] bg-white dark:bg-[#111418] border-r border-[#e5e7eb] dark:border-[#283039] p-4 flex-shrink-0">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex gap-3 items-center px-2 py-2 mb-6">
            <div className="bg-primary/20 aspect-square rounded-full size-10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-normal">NOM01Sauria</h1>
              <p className="text-xs text-text-secondary">v2.4.1 Enterprise</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? "bg-primary/10 dark:bg-[#283039] text-primary dark:text-white" 
                      : "text-text-secondary hover:bg-[#f3f4f6] dark:hover:bg-[#1f262e] hover:text-[#111418] dark:hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>{item.icon}</span>
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[#e5e7eb] dark:border-[#283039] pt-4">
            <div className="flex items-center gap-3 py-2">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gray-200" 
                style={{ backgroundImage: 'url("https://picsum.photos/seed/engineer/100/100")' }}></div>
              <div className="flex flex-col">
                <p className="text-sm font-bold">Ing. Roberto M.</p>
                <p className="text-xs text-text-secondary">Licencia Pro</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex items-center justify-between border-b border-[#e5e7eb] dark:border-[#283039] bg-white dark:bg-[#111418] px-6 py-3 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-[#637588] dark:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold tracking-tight lg:block hidden">
              {NAV_ITEMS.find(item => item.path === location.pathname)?.label || 'Suite de Ingeniería'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex gap-2">
                <button className="relative flex items-center justify-center rounded-lg size-10 hover:bg-[#f3f4f6] dark:hover:bg-[#283039] text-[#637588] dark:text-white transition-colors">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111418]"></span>
                </button>
                <button className="flex items-center justify-center rounded-lg size-10 hover:bg-[#f3f4f6] dark:hover:bg-[#283039] text-[#637588] dark:text-white transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
             </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div 
              className="w-72 bg-white dark:bg-[#111418] h-full p-4 flex flex-col gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-primary">NOM01Sauria</span>
                <button onClick={() => setIsSidebarOpen(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <nav className="flex flex-col gap-2">
                 {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        location.pathname === item.path ? "bg-primary/10 text-primary" : "text-text-secondary"
                      }`}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span>
                      <p className="text-sm font-medium">{item.label}</p>
                    </Link>
                  ))}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
