import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Captura from './pages/Captura';
import Admin from './pages/Admin';
import Download from './pages/Download';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route without Layout */}
        <Route path="/" element={<Login />} />

        {/* Captura route wrapped in 9:16 Layout */}
        <Route element={<Layout />}>
          <Route path="/captura" element={<Captura />} />
        </Route>

        {/* Admin route without the 9:16 Layout (full screen) */}
        <Route path="/admin/dashboard" element={<Admin />} />

        {/* Download public route */}
        <Route path="/download/:id" element={<Download />} />
        
        {/* Redirect unknown routes to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
