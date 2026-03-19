import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db } from '../firebase';

// Assets
import logoNexLab from '../assets/nexlab-logo.svg';

const STEPS = {
  START: 'start',
  LOADING: 'loading',
  CAMERA: 'camera',
  COUNTDOWN: 'countdown',
  REVIEW: 'review',
  RESULT: 'result'
};

const Captura = () => {
  const [step, setStep] = useState(STEPS.START);
  const [countdown, setCountdown] = useState(3);
  const [capturedImage, setCapturedImage] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [docId, setDocId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const webcamRef = useRef(null);
  const audioRef = useRef(new Audio('/click-sound.mp3')); // Simulando áudio

  // Helpers
  const startCamera = () => {
    setStep(STEPS.LOADING);
    // Simula tempo de carregamento da câmera
    setTimeout(() => {
      setStep(STEPS.CAMERA);
    }, 1500);
  };

  const startCountdown = () => {
    setStep(STEPS.COUNTDOWN);
    let counter = 3;
    setCountdown(counter);

    const interval = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      
      if (counter === 0) {
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = useCallback(() => {
    // Tenta tocar o som de click de forma segura para não travar
    try {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play prevented or file not found:", e));
      }
    } catch (e) {
      console.log("Audio exception:", e);
    }
    
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setStep(STEPS.REVIEW);
  }, [webcamRef]);

  const approvePhoto = async () => {
    setStep(STEPS.RESULT);
    await handleUpload(capturedImage);
  };

  const createFinalImage = async (base64Image) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Image;
      img.onload = () => {
        // Criar canvas 9:16
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        // Calcular proporção para cobrir todo o canvas (object-cover)
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;

        // Desenhar a foto base
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Adicionar moldura
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 32; // borda proporcional ao tamanho original
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Adicionar Logo
        const logoImg = new Image();
        // Usar a logo SVG invertida (branca)
        logoImg.src = logoNexLab;
        logoImg.onload = () => {
          // Dimensões da logo
          const logoWidth = 200;
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          ctx.filter = 'invert(1)'; // Inverter a cor da logo preta para branca
          ctx.globalAlpha = 0.8;
          ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, 80, logoWidth, logoHeight);
          ctx.filter = 'none'; // reset filter
          
          // Adicionar Texto
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = 'bold 48px sans-serif';
          ctx.textAlign = 'center';
          ctx.letterSpacing = '10px';
          // Sombra no texto
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 10;
          ctx.fillText('PHOTO OPP', canvas.width / 2, canvas.height - 100);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        
        logoImg.onerror = () => {
           // Fallback se a logo falhar
           resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
    });
  };

  const handleUpload = async (base64Image) => {
    setIsUploading(true);
    try {
      // 0. Gerar imagem composta (foto + moldura)
      const finalBase64Image = await createFinalImage(base64Image);

      // 1. Upload para o Firebase Storage
      const fileId = uuidv4();
      const storageRef = ref(storage, `capturas/${fileId}.jpg`);
      
      await uploadString(storageRef, finalBase64Image, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);
      
      setPhotoUrl(downloadUrl);

      // 2. Salvar documento no Firestore
      const docRef = await addDoc(collection(db, "capturas"), {
        url_da_foto: downloadUrl,
        data_hora: new Date().toISOString(),
        ip_usuario: "192.168.0.1", // Mock IP
        tipo_usuario: "promotor"
      });
      
      setDocId(docRef.id);

      // 3. Voltar automaticamente para a tela inicial após 10 segundos
      setTimeout(() => {
        resetFlow();
      }, 10000);

    } catch (error) {
      console.error("Erro ao fazer upload da foto: ", error);
      alert("Erro ao salvar a foto. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep(STEPS.CAMERA);
  };

  const resetFlow = () => {
    setCapturedImage(null);
    setPhotoUrl(null);
    setDocId(null);
    setIsUploading(false);
    setStep(STEPS.START);
  };

  // ----- Renders ----- //

  const renderStart = () => (
    <div className="flex flex-col items-center justify-between w-full h-full pt-20 pb-16 px-8 relative z-10">
      <div className="flex flex-col items-center">
        <img src={logoNexLab} alt="NEX.lab" className="h-16 mb-16" />
        <h1 className="text-[56px] font-bold text-black leading-tight text-center">Photo<br/>Opp</h1>
      </div>
      
      <button 
        onClick={startCamera}
        className="w-full max-w-[300px] h-[56px] bg-[#6A6A6A] hover:bg-gray-600 text-white font-bold text-lg transition-all shadow-[0_4px_4px_rgba(0,0,0,0.25)] active:scale-95 flex items-center justify-center mb-8"
      >
        Iniciar
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center w-full h-full relative z-10">
      {/* Ícone de Loading animado (Spinner) */}
      <svg className="animate-spin h-16 w-16 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  const renderCamera = () => (
    <div className="relative w-full h-full bg-black flex flex-col">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user", aspectRatio: 9/16 }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay de Câmera */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-12">
        {step === STEPS.CAMERA && (
          <button 
            onClick={startCountdown}
            className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 hover:bg-white/40 active:scale-90 transition-all flex items-center justify-center backdrop-blur-sm"
          >
            <div className="w-14 h-14 rounded-full bg-white/80"></div>
          </button>
        )}
        
        {step === STEPS.COUNTDOWN && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span className="text-[150px] font-bold text-white drop-shadow-2xl animate-pulse">
              {countdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="relative w-full h-full bg-black flex flex-col items-center">
      <img 
        src={capturedImage} 
        alt="Revisão" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Moldura SVG Simulada */}
      <div className="absolute inset-0 pointer-events-none z-10 border-[16px] border-white/20">
        <div className="absolute top-8 left-0 right-0 flex justify-center">
           <img src={logoNexLab} alt="NEX.lab" className="h-10 opacity-80 invert" />
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
           <p className="text-white/80 font-bold text-xl tracking-widest uppercase drop-shadow-md">Photo Opp</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-row items-center justify-around pb-12 px-8 bg-gradient-to-t from-black/80 to-transparent pt-12">
        <button 
          onClick={retakePhoto}
          className="px-6 py-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-full shadow-lg active:scale-95 transition"
        >
          Refazer
        </button>
        <button 
          onClick={approvePhoto}
          className="px-6 py-4 bg-white text-black font-bold rounded-full shadow-lg active:scale-95 transition"
        >
          Aprovar e Gerar QR Code
        </button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="relative w-full h-full bg-black flex flex-col items-center">
      <img 
        src={capturedImage} 
        alt="Captura" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Moldura SVG Simulada por cima da foto */}
      <div className="absolute inset-0 pointer-events-none z-10 border-[16px] border-white/20">
        <div className="absolute top-8 left-0 right-0 flex justify-center">
           <img src={logoNexLab} alt="NEX.lab" className="h-10 opacity-80 invert" />
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
           <p className="text-white/80 font-bold text-xl tracking-widest uppercase drop-shadow-md">Photo Opp</p>
        </div>
      </div>

      {/* Upload State / QR Code */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-8 text-center transition-opacity duration-500">
        {isUploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Salvando sua foto...</h2>
            <p className="text-gray-300">Aguarde um instante para pegar seu QR Code.</p>
          </div>
        ) : photoUrl ? (
          <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-black mb-6">Sua foto está pronta!</h2>
            <div className="bg-white p-4 border-4 border-black rounded-xl shadow-inner mb-6">
              <QRCodeSVG 
                value={`${window.location.origin}/download/${docId}`} 
                size={200}
                level={"H"}
                includeMargin={true}
              />
            </div>
            <p className="text-gray-600 mb-8 font-medium">Escaneie para baixar</p>
            
            <button 
              onClick={resetFlow}
              className="w-full h-[56px] bg-[#6A6A6A] hover:bg-gray-600 text-white font-bold text-lg rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              Tirar Outra
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-red-400 mb-6">Erro ao salvar</h2>
            <button 
              onClick={resetFlow}
              className="px-8 py-4 bg-white text-black font-bold rounded-full shadow-lg active:scale-95"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-white via-white to-gray-400 font-sans">
      {step === STEPS.START && renderStart()}
      {step === STEPS.LOADING && renderLoading()}
      {(step === STEPS.CAMERA || step === STEPS.COUNTDOWN) && renderCamera()}
      {step === STEPS.REVIEW && renderReview()}
      {step === STEPS.RESULT && renderResult()}
    </div>
  );
};

export default Captura;
