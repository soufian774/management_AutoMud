import app from './app';
import os from 'os';

// Porta del server (di default 3000 se non specificata nel .env)
const PORT = Number(process.env.PORT) || 3000;

// ✅ Funzione per ottenere IP locali
function getLocalNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          ips.push(address.address);
        }
      }
    }
  }
  
  return ips;
}

// ✅ Avvia server su tutte le interfacce per permettere connessioni di rete
const server = app.listen(PORT, '0.0.0.0', () => {
  const localIPs = getLocalNetworkIPs();
  
  console.log('\n🟢 AutoMud API Server Avviato');
  console.log('=====================================');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🏠 Localhost: http://localhost:${PORT}`);
  
  if (localIPs.length > 0) {
    console.log('📱 Rete locale:');
    localIPs.forEach(ip => {
      console.log(`   http://${ip}:${PORT}`);
    });
  }
  
  console.log(`🔗 Health check: /ping`);
  console.log('=====================================\n');
});

// ✅ Gestione errori
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Errore: Porta ${PORT} già in uso`);
    process.exit(1);
  } else {
    console.error('❌ Errore server:', error);
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