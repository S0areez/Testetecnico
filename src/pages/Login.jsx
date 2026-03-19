import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import assets
import logoNexLab from '../assets/nexlab-logo.svg';
import iconLetter from '../assets/Letter.svg';
import iconLock from '../assets/Senha.svg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Simulated login validation
    if (password !== '123456') {
      const errorMsg = 'Senha incorreta. Tente novamente.';
      setError(errorMsg);
      
      // Simulate backend log
      console.log(JSON.stringify({
        ip: '192.168.0.1', // mock IP
        route: '/login',
        status: 401,
        message: errorMsg,
        timestamp: new Date().toISOString()
      }, null, 2));
      return;
    }

    if (email.toLowerCase().includes('admin')) {
      navigate('/admin/dashboard');
    } else if (email.toLowerCase().includes('promotor')) {
      navigate('/captura');
    } else {
      const errorMsg = 'Usuário não reconhecido ou sem permissão.';
      setError(errorMsg);
      console.log(JSON.stringify({
        ip: '192.168.0.1',
        route: '/login',
        status: 401,
        message: errorMsg,
        timestamp: new Date().toISOString()
      }, null, 2));
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gradient-to-b from-white via-white to-gray-400 font-sans relative">
      <div className="w-full max-w-[400px] flex flex-col items-center pt-20 px-8 h-full">
        {/* Logo */}
        <div className="mb-12">
          <img src={logoNexLab} alt="NEX.lab" className="h-[90px]" />
        </div>
        
        {/* Título */}
        <h1 className="text-[40px] font-bold text-black mb-10 tracking-wide">Login</h1>
        
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
                className="absolute inset-0 w-full h-full pl-4 pr-12 bg-[#212121] text-white placeholder-gray-400 focus:outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-sm font-medium"
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
                className="absolute inset-0 w-full h-full pl-4 pr-12 bg-[#212121] text-white placeholder-gray-400 focus:outline-none shadow-[0_4px_4px_rgba(0,0,0,0.25)] text-sm font-medium"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <img src={iconLock} alt="Senha" className="w-[14px] h-[18px]" />
              </div>
            </div>

            {/* Lembrar e Esqueci a Senha */}
            <div className="flex items-center justify-between w-full mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-[14px] h-[14px] border border-gray-500 flex items-center justify-center bg-white">
                  <input type="checkbox" className="opacity-0 absolute w-0 h-0" />
                </div>
                <span className="text-[#6A6A6A] text-xs font-semibold">Lembrar</span>
              </label>
              <button type="button" className="text-[#6A6A6A] text-xs font-semibold hover:text-gray-800 transition-colors">
                Esqueci minha senha
              </button>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <p className="text-red-600 text-sm font-medium text-center mt-2">
                {error}
              </p>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full mt-24 h-[56px] bg-[#6A6A6A] hover:bg-gray-600 text-white font-bold text-lg transition-all shadow-[0_4px_4px_rgba(0,0,0,0.25)] active:scale-95 flex items-center justify-center"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
