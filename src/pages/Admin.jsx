import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import logoNexLab from '../assets/nexlab-logo.svg';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('fotos'); // 'fotos' ou 'logs'
  const [capturas, setCapturas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filteredCapturas, setFilteredCapturas] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  // Buscar dados do Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar Capturas
        const qCapturas = query(collection(db, "capturas"), orderBy("data_hora", "desc"));
        const snapCapturas = await getDocs(qCapturas);
        const dataCapturas = snapCapturas.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCapturas(dataCapturas);
        setFilteredCapturas(dataCapturas);

        // Buscar Logs
        const qLogs = query(collection(db, "logs"), orderBy("timestamp", "desc"));
        const snapLogs = await getDocs(qLogs);
        const dataLogs = snapLogs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLogs(dataLogs);
        setFilteredLogs(dataLogs);

      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtros de Capturas e Logs
  useEffect(() => {
    const filterByDate = (item, dateField) => {
      if (!dateFilter) return true;
      const itemDate = new Date(item[dateField]).toISOString().split('T')[0];
      return itemDate === dateFilter;
    };

    setFilteredCapturas(capturas.filter(c => filterByDate(c, 'data_hora')));
    setFilteredLogs(logs.filter(l => filterByDate(l, 'timestamp')));
    setCurrentPage(1); // Reseta para primeira página ao filtrar
  }, [dateFilter, capturas, logs]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCapturas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCapturas.length / itemsPerPage);

  const downloadLogsCSV = () => {
    const headers = ['Ação', 'Data/Hora', 'IP', 'Rota', 'Status', 'User ID', 'Role', 'Payload'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(l => [
        l.action,
        l.timestamp,
        l.ip_dispositivo,
        l.route,
        l.status,
        l.userId || 'N/A',
        l.role || 'N/A',
        JSON.stringify(l.payload).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-nexlab-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-12">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <img src={logoNexLab} alt="NEX.lab" className="h-6 md:h-8" />
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('fotos')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'fotos' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              FOTOS
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'logs' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              LOGS
            </button>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs md:text-sm px-3 md:px-4 py-2 bg-gray-800 text-white rounded hover:bg-black transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 md:mt-8">
        
        {/* Top Controls: Macros e Filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 md:mb-8 gap-4">
          {/* Cards de Macro */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1">
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Geral</h2>
              <span className="text-2xl font-black text-black">
                {loading ? '...' : (activeTab === 'fotos' ? capturas.length : logs.length)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1">
              <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filtrados</h2>
              <span className="text-2xl font-black text-blue-600">
                {loading ? '...' : (activeTab === 'fotos' ? filteredCapturas.length : filteredLogs.length)}
              </span>
            </div>
          </div>

          {/* Filtros e Ações */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:justify-end">
            {activeTab === 'logs' && (
              <button 
                onClick={downloadLogsCSV}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                BAIXAR CSV
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <label htmlFor="dateFilter" className="text-xs font-semibold text-gray-600">Data:</label>
              <input 
                type="date" 
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-gray-500"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="text-xs text-red-500 underline">Limpar</button>
              )}
            </div>

            {activeTab === 'fotos' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Itens:</label>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo da Tab */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'fotos' ? (
            <>
              {/* Table View (Desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-600 uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Miniatura</th>
                      <th className="px-6 py-4 font-semibold">Data / Hora</th>
                      <th className="px-6 py-4 font-semibold">IP</th>
                      <th className="px-6 py-4 font-semibold">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Carregando...</td></tr>
                    ) : currentItems.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Nada encontrado.</td></tr>
                    ) : (
                      currentItems.map((cap) => (
                        <tr key={cap.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <img src={cap.imageUrl} alt="Mini" className="h-12 w-12 object-cover rounded border border-gray-200 cursor-pointer" onClick={() => setSelectedPhoto(cap)} />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">{formatDate(cap.data_hora)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{cap.ip_usuario}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => setSelectedPhoto(cap)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] font-bold uppercase rounded">Detalhes</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Card View (Mobile) */}
              <div className="md:hidden divide-y divide-gray-200">
                {currentItems.map((cap) => (
                  <div key={cap.id} className="p-4 flex items-center gap-4" onClick={() => setSelectedPhoto(cap)}>
                    <img src={cap.imageUrl} alt="Mini" className="h-16 w-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{formatDate(cap.data_hora)}</p>
                      <p className="text-[10px] text-gray-500">{cap.ip_usuario}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {!loading && totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Página {currentPage} de {totalPages}</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-xs disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Logs View */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Ação</th>
                    <th className="px-4 py-3 font-semibold">Data/Hora</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Sem logs.</td></tr>
                  ) : (
                    filteredLogs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="text-[11px] hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-bold text-gray-700">{log.action}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        <td className="px-4 py-2 text-gray-500">{log.ip_dispositivo}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${log.status >= 400 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes da Foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 md:bg-black/80 backdrop-blur-sm md:p-4 overflow-y-auto">
          <div className="bg-white md:rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full min-h-screen md:min-h-0 flex flex-col md:flex-row relative">
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-20 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-800 transition-all shadow-lg">✕</button>
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center p-4 min-h-[50vh] md:min-h-0">
              <img src={selectedPhoto.imageUrl} alt="Ampliada" className="max-h-[80vh] w-full object-contain rounded" />
            </div>
            <div className="w-full md:w-2/5 p-8 flex flex-col items-center justify-center bg-gray-50">
              <img src={logoNexLab} alt="Logo" className="h-8 mb-8" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">QR Code</h3>
              <div className="bg-white p-4 border-4 border-gray-800 rounded-xl shadow-sm mb-8">
                <QRCodeSVG value={`${window.location.origin}/download/${selectedPhoto.id}`} size={200} level={"H"} includeMargin={true} />
              </div>
              <a href={selectedPhoto.imageUrl} download={`captura-${selectedPhoto.id}.jpg`} className="w-full py-4 bg-black text-white font-bold rounded-xl text-center uppercase text-xs tracking-widest">Baixar Original</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
