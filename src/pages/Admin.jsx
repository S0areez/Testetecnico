import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import logoNexLab from '../assets/nexlab-logo.svg';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [capturas, setCapturas] = useState([]);
  const [filteredCapturas, setFilteredCapturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Para o Modal
  const navigate = useNavigate();

  // Buscar dados do Firestore
  useEffect(() => {
    const fetchCapturas = async () => {
      try {
        const q = query(collection(db, "capturas"), orderBy("data_hora", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCapturas(data);
        setFilteredCapturas(data);
      } catch (error) {
        console.error("Erro ao buscar capturas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapturas();
  }, []);

  // Filtrar por data
  useEffect(() => {
    if (dateFilter) {
      const filtered = capturas.filter(cap => {
        // Formata a data ISO do banco (YYYY-MM-DDTHH:mm:ss.sssZ) para extrair apenas YYYY-MM-DD
        const capDate = new Date(cap.data_hora).toISOString().split('T')[0];
        return capDate === dateFilter;
      });
      setFilteredCapturas(filtered);
    } else {
      setFilteredCapturas(capturas);
    }
  }, [dateFilter, capturas]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-12">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <img src={logoNexLab} alt="NEX.lab" className="h-6 md:h-8" />
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="font-bold text-gray-700 text-sm md:text-base">Admin Dashboard</span>
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
          {/* Card de Macro */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 lg:max-w-xs">
            <h2 className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total de Fotos Capturadas</h2>
            <span className="text-3xl md:text-4xl font-black text-black">
              {loading ? '...' : capturas.length}
            </span>
          </div>

          {/* Filtro de Data */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:justify-end">
            <label htmlFor="dateFilter" className="text-xs md:text-sm font-semibold text-gray-600 whitespace-nowrap text-center sm:text-left">Filtrar por Data:</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 min-h-[42px]"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="text-xs text-red-500 hover:text-red-700 underline font-medium"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Capturas (Mobile e Desktop) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] md:text-xs text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Miniatura</th>
                  <th className="px-6 py-4 font-semibold">Data / Hora</th>
                  <th className="px-6 py-4 font-semibold">IP Usuário</th>
                  <th className="px-6 py-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">Carregando dados...</td>
                  </tr>
                ) : filteredCapturas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">Nenhuma captura encontrada.</td>
                  </tr>
                ) : (
                  filteredCapturas.map((cap) => (
                    <tr key={cap.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <img 
                          src={cap.imageUrl} 
                          alt="Miniatura" 
                          className="h-16 w-16 object-cover rounded cursor-pointer border border-gray-300 hover:opacity-80"
                          onClick={() => setSelectedPhoto(cap)}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium whitespace-nowrap text-sm">
                        {formatDate(cap.data_hora)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-sm">
                        {cap.ip_usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedPhoto(cap)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs rounded transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Hidden on Desktop) */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Carregando dados...</div>
            ) : filteredCapturas.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhuma captura encontrada.</div>
            ) : (
              filteredCapturas.map((cap) => (
                <div key={cap.id} className="p-4 flex items-center gap-4">
                  <img 
                    src={cap.imageUrl} 
                    alt="Miniatura" 
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    onClick={() => setSelectedPhoto(cap)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{formatDate(cap.data_hora)}</p>
                    <p className="text-xs text-gray-500 mb-2">{cap.ip_usuario}</p>
                    <button 
                      onClick={() => setSelectedPhoto(cap)}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10px] uppercase tracking-wider rounded transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 md:bg-black/80 backdrop-blur-sm md:p-4 overflow-y-auto">
          <div className="bg-white md:rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full min-h-screen md:min-h-0 flex flex-col md:flex-row relative">
            
            {/* Botão Fechar */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 md:bg-gray-200 md:hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-white md:text-gray-800 backdrop-blur-md md:backdrop-blur-none transition-all shadow-lg"
            >
              ✕
            </button>

            {/* Lado Esquerdo: Foto Grande */}
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center p-4 min-h-[50vh] md:min-h-0">
              <img 
                src={selectedPhoto.imageUrl} 
                alt="Captura ampliada" 
                className="max-h-[80vh] w-full object-contain rounded"
              />
            </div>

            {/* Lado Direito: Informações e QR Code */}
            <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col items-center justify-center bg-gray-50">
              <img src={logoNexLab} alt="NEX.lab" className="h-8 md:h-10 mb-6 md:mb-8" />
              
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 md:mb-2 text-center">Escaneie para Baixar</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 text-center leading-tight">Capturada em: <br/>{formatDate(selectedPhoto.data_hora)}</p>

              <div className="bg-white p-3 md:p-4 border-[3px] md:border-4 border-gray-800 rounded-xl shadow-sm mb-6 md:mb-8 max-w-[200px] md:max-w-none">
                <QRCodeSVG 
                  value={`${window.location.origin}/download/${selectedPhoto.id}`} 
                  size={window.innerWidth < 768 ? 160 : 220}
                  level={"H"}
                  includeMargin={true}
                />
              </div>

              <a 
                href={selectedPhoto.imageUrl} 
                download={`captura-${selectedPhoto.id}.jpg`}
                className="w-full py-4 md:py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl md:rounded-lg text-center transition-colors uppercase text-xs tracking-widest"
              >
                Abrir Imagem
              </a>
              
              <p className="mt-4 text-[10px] text-gray-400 text-center uppercase tracking-tighter">we make tech simple_</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
