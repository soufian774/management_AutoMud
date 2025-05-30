/**
 * Router per le richieste (Requests).
 * Espone le seguenti API:
 * - GET /api/requests       → elenco richieste (paginato o completo)
 * - GET /api/request/:id    → dettaglio di una richiesta
 */

import { Router } from 'express';
import { getRequests, getRequest } from '../controllers/request.controller';

const requestRouter = Router();

// Elenco richieste (con o senza paginazione)
requestRouter.get('/requests', getRequests);

// Dettaglio richiesta tramite ID
requestRouter.get('/request/:id', getRequest);

export default requestRouter;