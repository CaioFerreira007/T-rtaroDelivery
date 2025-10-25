import { Alert } from "react-bootstrap";
import { FaClock } from "react-icons/fa";

function AlertaLojaFechada({ status }) {
  if (status?.estaAberta) return null;

  return (
    <Alert variant="danger" className="text-center mb-4 shadow-sm">
      <Alert.Heading className="d-flex align-items-center justify-content-center gap-2">
        <FaClock size={24} />
        <span>Loja Fechada</span>
      </Alert.Heading>
      <p className="mb-2">
        {status?.mensagem || "Estamos fechados no momento."}
      </p>
      {status?.proximaAbertura && (
        <small className="text-muted">
          📅 Próxima abertura: {status.proximaAbertura}
        </small>
      )}
      {status?.horarioHoje && !status.horarioHoje.fechado && (
        <div className="mt-2">
          <small>
            🕐 Horário de hoje: {status.horarioHoje.abertura} -{" "}
            {status.horarioHoje.fechamento}
          </small>
        </div>
      )}
    </Alert>
  );
}

export default AlertaLojaFechada;
