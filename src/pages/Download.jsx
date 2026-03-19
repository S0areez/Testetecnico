import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logoNexLab from '../assets/nexlab-logo.svg';

const Download = () => {
  const { id } = useParams();
  const [photoData, setPhotoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const docRef = doc(db, 'capturas', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPhotoData(docSnap.data());
        } else {
          setError('Foto não encontrada.');
        }
      } catch (err) {
        console.error("Erro ao buscar foto:", err);
        setError('Erro ao carregar a foto.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [id]);

  const handleDownload = async () => {
    if (!photoData || !photoData.url_da_foto) return;
    
    try {
      // Fazer fetch da imagem para forçar o download direto em vez de abrir nova aba
      const response = await fetch(photoData.url_da_foto);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'nexlab-suaphoto.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erro no download:", err);
      // Fallback
      window.open(photoData.url_da_foto, '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-md w-full border border-gray-200">
        <img src={logoNexLab} alt="NEX.lab" className="h-10 mb-8" />

        {loading ? (
          <div className="flex flex-col items-center my-12">
            <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full mb-4"></div>
            <p className="text-gray-500 font-medium">Buscando sua foto...</p>
          </div>
        ) : error ? (
          <div className="text-center my-12">
            <p className="text-red-500 font-bold text-lg">{error}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Aqui está a sua foto!</h1>
            
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-inner mb-8">
              <img 
                src={photoData.url_da_foto} 
                alt="Sua foto da experiência NEX.lab" 
                className="w-full h-auto object-contain"
              />
            </div>

            <button 
              onClick={handleDownload}
              className="w-full py-4 bg-black hover:bg-gray-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar Foto
            </button>
            
            <p className="text-xs text-gray-400 mt-4 text-center">
              Obrigado por participar da nossa experiência.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Download;
