import express from 'express';
import requestRouter from './routes/request.routes';
import imageRouter from './routes/image.routes'; 
import { basicAuth } from './middlewares/basicAuth.middleware';
import cors from 'cors';

const app = express();

// ✅ CORS CONFIGURATO CORRETTAMENTE per rete locale
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    
    // ✅ IMPORTANTE: Permetti richieste senza origin (fetch diretto, app native)
    if (!origin) {
      console.log('✅ No origin header - allowing request');
      return callback(null, true);
    }
    
    // ✅ In sviluppo, permetti tutto per rete locale
    if (process.env.NODE_ENV !== 'production') {
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,           // localhost:any_port
        /^http:\/\/127\.0\.0\.1:\d+$/,        // 127.0.0.1:any_port
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // 192.168.x.x:any_port
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // 10.x.x.x:any_port
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+:\d+$/, // 172.16-31.x.x:any_port
        // ✅ HTTPS variants
        /^https:\/\/localhost:\d+$/,
        /^https:\/\/127\.0\.0\.1:\d+$/,
        /^https:\/\/192\.168\.\d+\.\d+:\d+$/,
        /^https:\/\/10\.\d+\.\d+\.\d+:\d+$/,
        /^https:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+:\d+$/,
      ];
      
      const isAllowed = allowedPatterns.some(pattern => {
        const match = pattern.test(origin);
        console.log(`🔍 Testing pattern ${pattern.source} against ${origin}: ${match}`);
        return match;
      });
      
      if (isAllowed) {
        console.log('✅ Origin allowed by pattern matching');
        return callback(null, true);
      } else {
        console.log('❌ Origin not allowed by patterns:', origin);
        // ✅ FALLBACK: Permetti comunque in sviluppo per debug
        console.log('🔧 Development mode - allowing anyway for debugging');
        return callback(null, true);
      }
    }
    
    // In produzione, lista domini specifici
    const allowedOrigins = [
      'https://your-production-domain.com',
    ];
    
    const isAllowed = allowedOrigins.includes(origin);
    console.log(`🏭 Production mode - origin allowed: ${isAllowed}`);
    callback(null, isAllowed);
  },
  
  // ✅ CRITICO: Abilita credenziali per Basic Auth
  credentials: true,
  
  // ✅ Metodi HTTP permessi
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  
  // ✅ Headers permessi - FONDAMENTALE per Basic Auth
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'Accept-Language',
    'Accept-Encoding',
    'Connection',
    'Host'
  ],
  
  // ✅ Headers esposti al client
  exposedHeaders: [
    'Content-Length', 
    'Content-Type', 
    'WWW-Authenticate',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  
  // ✅ Cache preflight requests
  maxAge: 86400, // 24 ore
  
  // ✅ Gestione preflight
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// ✅ Middleware di logging dettagliato
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📱 [${timestamp}] ${req.method} ${req.path}`);
  console.log('🌐 Origin:', req.get('origin') || 'no-origin');
  console.log('🏠 Host:', req.get('host'));
  console.log('🔑 Authorization:', req.get('authorization') ? 'present' : 'missing');
  console.log('📋 Content-Type:', req.get('content-type') || 'none');
  console.log('👤 User-Agent:', req.get('user-agent')?.substring(0, 50) + '...');
  
  // ✅ Log delle richieste OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('🔄 PREFLIGHT REQUEST - CORS check');
  }
  
  next();
});

// ✅ Parsing JSON e URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Health check endpoint PRIMA dell'autenticazione
app.get('/ping', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  console.log('🏓 Ping request from IP:', clientIP);
  
  // ✅ Headers CORS espliciti per /ping
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    message: 'AutoMud API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    server: {
      clientIP: clientIP,
      origin: req.get('origin'),
      host: req.get('host'),
      userAgent: req.get('user-agent')
    }
  });
});

// ✅ Endpoint di test CORS
app.get('/test-cors', (req, res) => {
  console.log('🧪 CORS test endpoint called');
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({
    message: 'CORS test successful',
    origin: req.get('origin'),
    timestamp: new Date().toISOString()
  });
});

// 🛡️ Basic Auth middleware SOLO per rotte /api
app.use('/api', basicAuth);

// ✅ Rotte API
app.use('/api', requestRouter);
app.use('/api', imageRouter);

// ✅ Catch-all
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Endpoint non trovato',
    path: req.originalUrl,
    method: req.method
  });
});

export default app;