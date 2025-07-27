import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function RotaPrivada({ children }) {
  const { user } = useContext(AuthContext);

  if (user === null) {
    // ainda carregando: não renderiza nada, mas evita piscar
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default RotaPrivada;
