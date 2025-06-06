import express from 'express';
import requestRouter from './routes/request.routes';
import imageRouter from './routes/image.routes'; 
import { basicAuth } from './middlewares/basicAuth.middleware';
import cors from 'cors';

const app = express();

// ✅ CORS configurato per sviluppo e produzione
app.use(cors({
  origin: function (origin, callback) {
    // Permetti richieste senza origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In sviluppo, permetti localhost e IP di rete locale
    if (process.env.NODE_ENV !== 'production') {
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,           // localhost:any_port
        /^http:\/\/127\.0\.0\.1:\d+$/,        // 127.0.0.1:any_port
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // 192.168.x.x:any_port
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // 10.x.x.x:any_port
      ];
      
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      return callback(null, isAllowed);
    }
    
    // In produzione, configura qui i domini permessi
    const allowedOrigins = [
      'https://your-production-domain.com',
      // Aggiungi altri domini di produzione qui
    ];
    
    const isAllowed = allowedOrigins.includes(origin);
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// ✅ Parsing JSON e URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Endpoint di health check senza autenticazione
app.get('/ping', (req, res) => {
  res.json({
    message: 'AutoMud API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 🛡️ Autenticazione Basic su tutte le rotte API
app.use(basicAuth);

// ✅ Rotte API
app.use('/api', requestRouter);
app.use('/api', imageRouter);

// ✅ Catch-all per rotte non definite
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

export default app;