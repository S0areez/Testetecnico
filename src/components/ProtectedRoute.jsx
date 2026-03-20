import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { logEvent } from '../utils/logger';

/**
 * Componente para proteger rotas com base em autenticação e papéis (RBAC)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos
 * @param {string|string[]} [props.allowedRoles] - Papéis permitidos (ex: 'admin' ou ['admin', 'promoter'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Busca o papel do usuário no Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role);
            setUser(firebaseUser);
          } else {
            // Caso o usuário exista no Auth mas não no Firestore
            console.error("Usuário não possui documento no Firestore.");
            await logEvent({
              action: 'AUTH_ERROR_NO_FIRESTORE_DOC',
              route: location.pathname,
              payload: { uid: firebaseUser.uid },
              status: 403
            });
            setUser(null);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Erro na verificação de ProtectedRoute:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Verificando acesso...</p>
      </div>
    );
  }

  // Se não estiver logado, redireciona para o login
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verificação de papéis (RBAC)
  if (allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!rolesArray.includes(role)) {
      // LOG: Tentativa de acesso não autorizado
      logEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        route: location.pathname,
        payload: { userId: user.uid, userRole: role, requiredRoles: rolesArray },
        status: 403
      });

      // Redireciona para o login por segurança
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
