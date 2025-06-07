// src/lib/api.ts - Configurazione con debugging

const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    console.log('🌐 Frontend hostname detected:', hostname);
    
    // Se siamo su rete locale (non localhost), usa lo stesso IP ma porta 3000
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const apiUrl = `http://${hostname}:3000`;
      console.log('🔗 Using network API URL:', apiUrl);
      return apiUrl;
    }
    
    // Sviluppo locale
    console.log('🏠 Using localhost API URL');
    return 'http://localhost:3000';
  }
  
  // Produzione - configura qui il tuo dominio di produzione
  return 'https://your-production-api.com';
};

export const API_BASE_URL = getApiBaseUrl();

// ✅ FUNZIONE DI TEST PING separata
export const testPing = async (): Promise<boolean> => {
  const pingUrl = `${API_BASE_URL}/ping`;
  console.log('🏓 Testing ping to:', pingUrl);
  
  try {
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // ✅ Timeout di 5 secondi
      signal: AbortSignal.timeout(5000)
    });

    console.log('📊 Ping response:', {
      status: response.status,
      ok: response.ok,
      url: response.url
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ping successful:', data.message);
      return true;
    } else {
      console.log('❌ Ping failed with status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ping error:', error);
    
    // ✅ Analisi dettagliata errore
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🚫 NETWORK ERROR: Cannot reach server at', pingUrl);
      console.error('💡 Check if backend is running and accessible');
    } else if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.error('⏱️ TIMEOUT: Server took too long to respond');
    }
    
    return false;
  }
};

export const testAuth = async (username: string, password: string): Promise<boolean> => {
  const authUrl = `${API_BASE_URL}/api/request/count`;
  console.log('🔐 Testing auth to:', authUrl);
  console.log('👤 Username:', username);
  
  try {
    // ✅ STEP 1: Prima testa il ping
    console.log('🧪 Step 1: Testing connectivity...');
    const pingOk = await testPing();
    
    if (!pingOk) {
      throw new Error('Server non raggiungibile. Verifica che il backend sia avviato su ' + API_BASE_URL);
    }
    
    console.log('✅ Step 1: Server is reachable');
    console.log('🔐 Step 2: Testing authentication...');
    
    // ✅ STEP 2: Test autenticazione
    const credentials = btoa(`${username}:${password}`);
    console.log('🔑 Credentials encoded, making auth request...');
    
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      // ✅ Timeout di 10 secondi per auth
      signal: AbortSignal.timeout(10000)
    });

    console.log('📊 Auth response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Auth failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // ✅ Errori specifici
      if (response.status === 401) {
        console.error('🔐 UNAUTHORIZED: Wrong username/password or auth header issue');
      } else if (response.status === 403) {
        console.error('🚫 FORBIDDEN: Access denied');
      } else if (response.status === 404) {
        console.error('🔍 NOT FOUND: API endpoint /api/request/count not found');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🚫 FETCH FAILED: Cannot connect to', authUrl);
      console.error('💡 Possible causes:');
      console.error('   - Backend not running');
      console.error('   - Wrong IP/port');
      console.error('   - Firewall blocking');
      console.error('   - CORS issues');
    } else if (error instanceof DOMException && error.name === 'TimeoutError') {
      console.error('⏱️ AUTH TIMEOUT: Server too slow to respond');
    }
    
    return false;
  }
};