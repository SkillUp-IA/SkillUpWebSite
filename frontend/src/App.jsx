// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthPage from './pages/Auth.jsx';
import RegisterPage from './pages/Register.jsx';

export default function App() {
  return (
    <Routes>
      {/* Raiz SEMPRE vai para a tela de login/registro */}
      <Route path="/" element={<Navigate to="/auth" replace />} />

      {/* Login / Criar conta */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Cadastro de perfil completo (pode ficar fora do ProtectedRoute, já que cria a conta) */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Lista de perfis (cards) protegida */}
      <Route
        path="/perfis"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Qualquer rota inválida → /auth */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
