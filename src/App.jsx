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
import './index.css';

// Componente ProtectedRoute
const ProtectedRoute = ({ children, allowedRole }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-100">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redireciona para o login se o papel não for permitido (conforme solicitado)
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de Login */}
        <Route path="/" element={<Login />} />

        {/* Fluxo de Ativação (Promotor) - Protegido */}
        <Route element={<ProtectedRoute allowedRole="promoter"><Layout /></ProtectedRoute>}>
          <Route path="/ativacao" element={<Captura />} />
        </Route>

        {/* Dashboard Admin - Protegido */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
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
