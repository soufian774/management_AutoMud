/**
 * Router per la gestione delle immagini delle richieste.
 * 
 * API Endpoints:
 * - GET    /api/request/:id/images           → elenco immagini della richiesta
 * - POST   /api/request/:id/images           → upload nuove immagini (multiple)
 * - GET    /api/request/:id/images/:imageId/info → info dettagliate immagine
 * - PUT    /api/request/:id/images/:imageId/replace → sostituisce immagine
 * - DELETE /api/request/:id/images/:imageId  → elimina singola immagine
 * - DELETE /api/request/:id/images           → elimina tutte le immagini
 */

import { Router } from 'express';
import { 
  uploadImages,
  getImages,
  deleteImage,
  deleteAllImages,
  replaceImage,
  getImageInfo,
  upload
} from '../controllers/image.controller';

const imageRouter = Router();

// ✅ Ottieni elenco immagini per una richiesta
imageRouter.get('/request/:id/images', getImages);

// ✅ Upload di nuove immagini (multiple)
// Middleware multer per gestire fino a 10 file
imageRouter.post('/request/:id/images', upload.array('images', 10), uploadImages);

// ✅ Info dettagliate su una specifica immagine
imageRouter.get('/request/:id/images/:imageId/info', getImageInfo);

// ✅ Sostituisci una specifica immagine
// Middleware multer per un singolo file
imageRouter.put('/request/:id/images/:imageId/replace', upload.single('image'), replaceImage);

// ✅ Elimina una specifica immagine
imageRouter.delete('/request/:id/images/:imageId', deleteImage);

// ✅ Elimina tutte le immagini di una richiesta
imageRouter.delete('/request/:id/images', deleteAllImages);

export default imageRouter;