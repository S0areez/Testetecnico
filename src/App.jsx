import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './pages/Login';
import Captura from './pages/Captura';
import Admin from './pages/Admin';
import Download from './pages/Download';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de Login */}
        <Route path="/" element={<Login />} />

        {/* Fluxo de Ativação (Promotor) - Protegido */}
        <Route element={<ProtectedRoute allowedRoles="promoter"><Layout /></ProtectedRoute>}>
          <Route path="/ativacao" element={<Captura />} />
        </Route>

        {/* Dashboard Admin - Protegido */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles="admin">
              <Admin />
            </ProtectedRoute>
          } 
        />

        {/* Rota pública de Download */}
        <Route path="/download/:id" element={<Download />} />
        
        {/* Redirecionamento para Login se não autenticado, ou rota correta se autenticado */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
