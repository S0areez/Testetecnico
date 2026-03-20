import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Import assets
import logoNexLab from '../assets/nexlab-logo.svg';
import iconLetter from '../assets/Letter.svg';
import iconLock from '../assets/Senha.svg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Buscar a role do usuário no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin');
        } else if (userData.role === 'promoter') {
          navigate('/ativacao');
        } else {
          setError('Papel de usuário não definido.');
        }
      } else {
        setError('Usuário não encontrado no banco de dados.');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email ou senha incorretos.');
      } else {
        setError('Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gradient-to-b from-white via-white to-gray-400 font-sans relative overflow-x-hidden">
      <div className="w-full max-w-[400px] flex flex-col items-center pt-10 md:pt-20 px-6 md:px-8 h-full">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <img src={logoNexLab} alt="NEX.lab" className="h-[60px] md:h-[90px]" />
        </div>
        
        {/* Título */}
        <h1 className="text-[32px] md:text-[40px] font-bold text-black mb-6 md:mb-10 tracking-wide text-center">Login</h1>
        
        {/* Formulário */}
        <div className="w-full flex flex-col items-center">
          <form onSubmit={handleLogin} className="flex flex-col w-full gap-4">
            {/* Campo de Email */}
            <div className="relative w-full h-[52px]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="absolute inset-0 w-full h-full pl-4 pr-12 bg-[#212121] text-white placeholder-gray-400 focus:outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-sm font-medium rounded-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <img src={iconLetter} alt="Email" className="w-[18px] h-[14px]" />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="relative w-full h-[52px] mt-2">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="absolute inset-0 w-full h-full pl-4 pr-12 bg-[#212121] text-white placeholder-gray-400 focus:outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-sm font-medium rounded-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <img src={iconLock} alt="Senha" className="w-[14px] h-[18px]" />
              </div>
            </div>

            {/* Lembrar e Esqueci a Senha */}
            <div className="flex items-center justify-between w-full mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-[16px] h-[16px] border border-gray-400 flex items-center justify-center bg-white rounded-sm">
                  <input type="checkbox" className="opacity-0 absolute w-0 h-0" />
                  <div className="w-2 h-2 bg-gray-600 hidden"></div> {/* Custom checkbox if needed */}
                </div>
                <span className="text-[#6A6A6A] text-[10px] md:text-xs font-semibold">Lembrar</span>
              </label>
              <button type="button" className="text-[#6A6A6A] text-[10px] md:text-xs font-semibold hover:text-gray-800 transition-colors">
                Esqueci minha senha
              </button>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <p className="text-red-600 text-xs md:text-sm font-medium text-center mt-2 px-2">
                {error}
              </p>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-12 md:mt-24 h-[56px] ${loading ? 'bg-gray-400' : 'bg-[#6A6A6A] hover:bg-gray-600'} text-white font-bold text-lg transition-all shadow-[0_4px_4px_rgba(0,0,0,0.25)] active:scale-95 flex items-center justify-center rounded-sm uppercase tracking-widest`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
