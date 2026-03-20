/**
 * @component 
 * @description 
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

import { collection, addDoc } from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';

import { db, auth } from '../firebase';
import { logEvent } from '../utils/logger';

import logoNexLab from '../assets/nexlab-logo.svg';
import backgroundFrame from '../assets/background-frame.svg';

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
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (step === STEPS.CAMERA && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [step]);

  const startCamera = async () => {
    setStep(STEPS.LOADING);
    try {
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9/16 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      setStep(STEPS.CAMERA);
      
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        setStep(STEPS.CAMERA);
      } catch (fallbackErr) {
        alert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
        setStep(STEPS.START);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartCountdown = () => {
    setStep(STEPS.COUNTDOWN);
    let counter = 3;
    setCountdown(counter);

    const interval = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      
      if (counter === 0) {
        clearInterval(interval);
        handleCapturePhoto();
      }
    }, 1000);
  };

  const handleCapturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageSrc);
      stopCamera();
      setStep(STEPS.REVIEW);
    }
  }, [videoRef, canvasRef]);

  const handleApprovePhoto = async () => {
    setStep(STEPS.RESULT);
    await handleUploadPhoto(capturedImage);
  };

  const createFinalImage = async (base64Image) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const photoX = 98;
        const photoY = 277;
        const photoWidth = 982 - 98;
        const photoHeight = 1540 - 277;
        
        const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
        const x = photoX + (photoWidth / 2) - (img.width / 2) * scale;
        const y = photoY + (photoHeight / 2) - (img.height / 2) * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX, photoY, photoWidth, photoHeight);
        ctx.clip();
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        ctx.restore();

        const frameImg = new Image();
        frameImg.src = backgroundFrame;
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          
          const logoImg = new Image();
          logoImg.src = logoNexLab;
          logoImg.onload = () => {
            ctx.drawImage(logoImg, 98, 120, 180, 60);
            
            ctx.fillStyle = '#333333';
            ctx.font = '500 32px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('we make tech simple_', 982, 160);

            ctx.textAlign = 'center';
            ctx.fillText('we make tech simple_', canvas.width / 2, 1820);

            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          logoImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        
        frameImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleUploadPhoto = async (base64Image) => {
    setIsUploading(true);
    try {
      const finalBase64Image = await createFinalImage(base64Image);

      const docRef = await addDoc(collection(db, "capturas"), {
        imageUrl: finalBase64Image,
        data_hora: new Date().toISOString(),
        ip_usuario: "192.168.0.1", 
        tipo_usuario: "promotor"
      });
      
      setPhotoUrl(finalBase64Image);
      setDocId(docRef.id);

      await logEvent({
        action: 'PHOTO_CAPTURE_SUCCESS',
        route: '/ativacao',
        payload: { docId: docRef.id },
        status: 200,
        userId: auth.currentUser?.uid,
        role: 'promoter'
      });

    } catch (error) {
      await logEvent({
        action: 'PHOTO_CAPTURE_ERROR',
        route: '/ativacao',
        payload: { error: error.message },
        status: 500,
        userId: auth.currentUser?.uid,
        role: 'promoter'
      });

      alert("Não foi possível salvar sua foto. Por favor, tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleResetFlow = () => {
    stopCamera();
    setCapturedImage(null);
    setPhotoUrl(null);
    setDocId(null);
    setIsUploading(false);
    setStep(STEPS.START);
  };

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
      <div className="animate-spin h-16 w-16 border-4 border-[#475569] border-t-transparent rounded-full mb-4"></div>
      <p className="text-[#475569] font-medium tracking-widest uppercase text-sm">Iniciando câmera...</p>
    </div>
  );

  const renderCamera = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[420px] aspect-[9/16] shadow-lg overflow-hidden rounded-xl bg-white border border-gray-100">
        <img 
          src={backgroundFrame} 
          alt="Moldura de Fundo" 
          className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" 
        />

        <div className="absolute inset-0 bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col">
          <div className="h-[14.4%] px-8 flex items-center justify-between">
            <img src={logoNexLab} alt="NEX.lab" className="h-6" />
            <span className="text-black font-mono text-[10px]">we make tech simple_</span>
          </div>
          
          <div className="flex-1"></div>

          <div className="h-[5.1%] flex items-center justify-center">
            <span className="text-black font-mono text-[10px]">we make tech simple_</span>
          </div>
        </div>

        <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-12">
          {step === STEPS.CAMERA && (
            <button 
              onClick={handleStartCountdown}
              className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-white"></div>
            </button>
          )}
          
          {step === STEPS.COUNTDOWN && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <span className="text-8xl font-black text-white animate-pulse">
                {countdown}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-full max-w-[420px] aspect-[9/16] shadow-lg overflow-hidden rounded-xl border border-gray-100 bg-white">
        <img 
          src={backgroundFrame} 
          alt="Moldura de Fundo" 
          className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" 
        />

        <div className="absolute top-0 left-0 right-0 h-[14.4%] px-8 flex items-center justify-between z-30">
          <img src={logoNexLab} alt="NEX.lab" className="h-6" />
          <span className="text-black font-mono text-[10px]">we make tech simple_</span>
        </div>

        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
          <img
            src={capturedImage}
            alt="Revisão"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[5.1%] flex items-center justify-center z-30">
          <span className="text-black font-mono text-[10px]">we make tech simple_</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-[420px] mx-auto px-4">
        <button
          onClick={handleRetakePhoto}
          className="flex-1 bg-gray-200 text-gray-700 font-bold text-sm py-4 px-6 rounded-lg hover:bg-gray-300 transition-colors uppercase tracking-widest"
        >
          Refazer
        </button>

        <button
          onClick={handleApprovePhoto}
          className="flex-1 bg-[#4B5563] text-white font-bold text-sm py-4 px-6 rounded-lg hover:bg-gray-700 transition-colors border-2 border-transparent uppercase tracking-widest"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-[420px] aspect-[9/16] shadow-lg overflow-hidden rounded-xl border border-gray-100 bg-white">
        <img 
          src={backgroundFrame} 
          alt="Moldura de Fundo" 
          className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" 
        />

        <div className="absolute top-0 left-0 right-0 h-[14.4%] px-8 flex items-center justify-between z-30">
          <img src={logoNexLab} alt="NEX.lab" className="h-6" />
          <span className="text-black font-mono text-[10px]">we make tech simple_</span>
        </div>

        <div className="absolute inset-0 bg-white overflow-hidden">
           <img 
            src={capturedImage} 
            alt="Captura" 
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute bottom-[8%] right-6 z-40 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center transform scale-90 origin-bottom-right animate-in slide-in-from-bottom-4 duration-500">
            <span className="text-slate-700 font-bold text-[10px] mb-2 uppercase tracking-tight">Fazer download</span>
            <div className="bg-white p-2 rounded-lg shadow-inner border border-slate-50">
              <QRCodeSVG 
                value={`${window.location.origin}/download/${docId}`} 
                size={120}
                level={"H"}
                includeMargin={true}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[5.1%] flex items-center justify-center z-30">
          <span className="text-black font-mono text-[10px]">we make tech simple_</span>
        </div>

        {!isUploading && photoUrl && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-[280px] border border-slate-100 animate-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Obrigado!</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Sua foto foi salva com sucesso. Use o QR Code para baixar.
              </p>
              <button 
                onClick={() => setPhotoUrl(null)} 
                className="w-full py-3 bg-[#4B5563] text-white rounded-lg font-bold hover:bg-gray-700 transition-colors shadow-md uppercase text-xs tracking-widest"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 w-full max-w-[420px] px-4">
        <button 
          onClick={handleResetFlow}
          className="w-full py-5 bg-[#4B5563] hover:bg-gray-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-md uppercase tracking-[0.2em] text-sm"
        >
          Finalizar
        </button>
      </div>

      {isUploading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
          <div className="animate-spin h-12 w-12 border-4 border-[#4B5563] border-t-transparent rounded-full mb-4"></div>
          <h2 className="text-xl font-bold text-slate-900 tracking-widest uppercase">Salvando...</h2>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-[#F3F4F6] to-white font-sans">
      <div className="relative z-10 w-full h-full">
        {step === STEPS.START && renderStart()}
        {step === STEPS.LOADING && renderLoading()}
        {(step === STEPS.CAMERA || step === STEPS.COUNTDOWN) && renderCamera()}
        {step === STEPS.REVIEW && renderReview()}
        {step === STEPS.RESULT && renderResult()}
      </div>
    </div>
  );
};

export default Captura;
