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
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <img src={logoNexLab} alt="NEX.lab" className="h-8" />
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-700">Admin Dashboard</span>
          <button 
            onClick={() => navigate('/')}
            className="text-sm px-4 py-2 bg-gray-800 text-white rounded hover:bg-black transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Top Controls: Macros e Filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* Card de Macro */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-[250px]">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total de Fotos Capturadas</h2>
            <span className="text-4xl font-black text-black">
              {loading ? '...' : capturas.length}
            </span>
          </div>

          {/* Filtro de Data */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <label htmlFor="dateFilter" className="text-sm font-semibold text-gray-600">Filtrar por Data:</label>
            <input 
              type="date" 
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Miniatura</th>
                  <th className="px-6 py-4 font-semibold">Data / Hora</th>
                  <th className="px-6 py-4 font-semibold">IP Usuário</th>
                  <th className="px-6 py-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Carregando dados...</td>
                  </tr>
                ) : filteredCapturas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Nenhuma captura encontrada.</td>
                  </tr>
                ) : (
                  filteredCapturas.map((cap) => (
                    <tr key={cap.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <img 
                          src={cap.url_da_foto} 
                          alt="Miniatura" 
                          className="h-16 w-16 object-cover rounded cursor-pointer border border-gray-300 hover:opacity-80"
                          onClick={() => setSelectedPhoto(cap)}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium whitespace-nowrap">
                        {formatDate(cap.data_hora)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {cap.ip_usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedPhoto(cap)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm rounded transition-colors"
                        >
                          Ver QR Code
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes da Foto */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row relative">
            
            {/* Botão Fechar */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-800"
            >
              ✕
            </button>

            {/* Lado Esquerdo: Foto Grande */}
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center p-4">
              <img 
                src={selectedPhoto.url_da_foto} 
                alt="Captura ampliada" 
                className="max-h-[70vh] object-contain rounded"
              />
            </div>

            {/* Lado Direito: Informações e QR Code */}
            <div className="w-full md:w-2/5 p-8 flex flex-col items-center justify-center bg-gray-50">
              <img src={logoNexLab} alt="NEX.lab" className="h-10 mb-8" />
              
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Escaneie para Baixar</h3>
              <p className="text-sm text-gray-500 mb-8 text-center">Capturada em: <br/>{formatDate(selectedPhoto.data_hora)}</p>

              <div className="bg-white p-4 border-4 border-gray-800 rounded-xl shadow-sm mb-8">
                <QRCodeSVG 
                  value={selectedPhoto.url_da_foto} 
                  size={220}
                  level={"H"}
                  includeMargin={true}
                />
              </div>

              <a 
                href={selectedPhoto.url_da_foto} 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-lg text-center transition-colors"
              >
                Abrir Link da Imagem
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
