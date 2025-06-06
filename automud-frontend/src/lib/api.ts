// src/lib/api.ts - Configurazione pulita e adattabile

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    
    // Se siamo su rete locale (non localhost), usa lo stesso IP ma porta 3000
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
    
    // Sviluppo locale
    return 'http://localhost:3000';
  }
  
  // Produzione - configura qui il tuo dominio di produzione
  return 'https://your-production-api.com';
};

export const API_BASE_URL = getApiBaseUrl();

export const testAuth = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/request/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return response.ok;
    
  } catch (error) {
    console.error('Errore durante autenticazione:', error);
    return false;
  }
}