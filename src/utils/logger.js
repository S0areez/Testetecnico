import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Função utilitária para registrar logs no Firestore
 * @param {Object} logData - Dados do log
 * @param {string} logData.action - Ação realizada (ex: 'LOGIN_SUCCESS', 'LOGIN_ERROR_PASSWORD')
 * @param {string} logData.route - Rota onde ocorreu a ação
 * @param {Object} logData.payload - Dados enviados (remover senhas antes)
 * @param {number} logData.status - Status final (200, 401, 500, etc)
 * @param {string} [logData.userId] - ID do usuário (opcional)
 * @param {string} [logData.role] - Cargo do usuário (opcional)
 */
export const logEvent = async ({ action, route, payload, status, userId = null, role = null }) => {
  try {
    // Tenta obter o IP via serviço externo simples
    let ip = "0.0.0.0";
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ip = data.ip;
    } catch (e) {
      console.warn("Não foi possível capturar o IP real:", e);
    }

    await addDoc(collection(db, "logs"), {
      action,
      route,
      payload,
      status,
      userId,
      role,
      ip_dispositivo: ip,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gravar log no Firestore:", error);
  }
};
