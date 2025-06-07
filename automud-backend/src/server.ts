import app from './app';
import os from 'os';

// Porta del server (di default 3000 se non specificata nel .env)
const PORT = Number(process.env.PORT) || 3000;

// ✅ Funzione per ottenere IP locali CON DEBUG
function getLocalNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  
  console.log('🔍 Scanning network interfaces...');
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      console.log(`📡 Interface ${interfaceName}:`);
      for (const address of addresses) {
        console.log(`   ${address.family} ${address.address} (internal: ${address.internal})`);
        
        if (address.family === 'IPv4' && !address.internal) {
          ips.push(address.address);
          console.log(`   ✅ Added to server IPs: ${address.address}`);
        }
      }
    }
  }
  
  return ips;
}

// ✅ Avvia server su tutte le interfacce per permettere connessioni di rete
console.log('🚀 Starting AutoMud API Server...');
console.log(`🎯 Attempting to bind on 0.0.0.0:${PORT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  const localIPs = getLocalNetworkIPs();
  
  console.log('\n🟢 AutoMud API Server Avviato');
  console.log('=====================================');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🏠 Localhost: http://localhost:${PORT}`);
  console.log(`🏠 127.0.0.1: http://127.0.0.1:${PORT}`);
  
  if (localIPs.length > 0) {
    console.log('📱 Rete locale:');
    localIPs.forEach(ip => {
      console.log(`   http://${ip}:${PORT}`);
    });
  } else {
    console.log('⚠️  Nessun IP di rete locale trovato');
    console.log('💡 Possibili cause:');
    console.log('   - Non connesso a rete WiFi/Ethernet');
    console.log('   - Interfacce di rete disabilitate');
    console.log('   - Problema configurazione di rete');
  }

});

// ✅ Gestione errori CON DEBUG
server.on('error', (error: any) => {
  console.error('\n💥 SERVER ERROR:', error);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Errore: Porta ${PORT} già in uso`);
    console.error('💡 Soluzioni:');
    console.error('   1. Cambia porta: PORT=3001 npm run dev');
    console.error('   2. Termina processo: killall node');
    console.error('   3. Trova processo: lsof -i :3000');
    process.exit(1);
  } else if (error.code === 'EADDRNOTAVAIL') {
    console.error(`❌ Errore: Indirizzo 0.0.0.0:${PORT} non disponibile`);
    console.error('💡 Il sistema non supporta binding su 0.0.0.0');
    process.exit(1);
  } else {
    console.error('❌ Errore server generico:', error);
    process.exit(1);
  }
});

// ✅ Gestione chiusura graceful
process.on('SIGTERM', () => {
  console.log('\n🛑 Chiusura server in corso...');
  server.close(() => {
    console.log('🛑 Server chiuso correttamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Interruzione ricevuta (Ctrl+C)');
  server.close(() => {
    console.log('🛑 Server chiuso correttamente');
    process.exit(0);
  });
});