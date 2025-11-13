// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  const location = useLocation();

  // se não estiver autenticado, manda para /auth e guarda para onde o usuário queria ir
  if (!isAuth) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // autenticado → renderiza o conteúdo protegido
  return children;
}
