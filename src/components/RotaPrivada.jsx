import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function RotaPrivada({ children }) {
  const { user } = useContext(AuthContext);

  if (user === null) {
    // aguardando o contexto carregar
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default RotaPrivada;
