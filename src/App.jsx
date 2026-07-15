import React from 'react';
import ExcelDropzone from './components/ExcelDropzone';
import { Truck, Users, LayoutDashboard, FileSpreadsheet } from 'lucide-react';

function App() {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col fixed h-full shadow-lg z-10">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <Truck className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold tracking-tight">DTLL</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-lg shadow-sm transition-colors">
            <FileSpreadsheet className="w-5 h-5 text-blue-300" />
            <span className="font-medium">Ingesta Operativa</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Consola Despacho</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium">Finanzas y Nómina</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm py-4 px-8 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Carga de Planificación</h2>
          <p className="text-sm text-gray-500 mt-1">Importe la malla operativa para generar los viajes y manifiestos de la jornada.</p>
        </header>

        {/* Content Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          <ExcelDropzone />
        </div>
      </main>
    </div>
  );
}

export default App;
