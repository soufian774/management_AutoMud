// src/controllers/request.controller.ts - VERSIONE CORRETTA SENZA ERRORI

import { Request, Response, RequestHandler } from 'express';
import {
  getRequestsPaged,
  getRequestById,
  getTotalRequestCount,
  getStatusCounts,
  StatusFilter
} from '../services/request.service';
import {
  getStatusHistoryByRequestId,
  getCurrentStatusByRequestId,
  addStatusChange
} from '../services/request-status.service';
import {
  getManagementByRequestId,
  updateFinalOutcome,
  upsertManagement
} from '../services/request-management.service';
import {
  getOffersByRequestId,
  addOffer,
  updateOffer,
  deleteOffer
} from '../services/request-offer.service';
import { StatusChangeRequest } from '../models/request-status.model';
import { RequestManagementRecord } from '../models/request-management.model';
import { RequestOfferRecord } from '../models/request-offer.model';
import { RequestStatusRecord } from '../models/request-status.model';
import { pool } from '../db/pool';

/**
 * GET /api/requests
 * Restituisce un elenco paginato di richieste con ricerca opzionale e filtri stati.
 */
export const getRequests: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 12;

  const page = parseInt(req.query.page as string, 10) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT;
  const search = req.query.search as string | undefined;
  
  // 🆕 PARSING FILTRI STATI
  const statusFilter: StatusFilter = {
    all: req.query.all === 'true',
    dChiamare: req.query.dChiamare === 'true',
    inCorso: req.query.inCorso === 'true', 
    pratiRitiro: req.query.pratiRitiro === 'true',
    esitoFinale: req.query.esitoFinale === 'true'
  };

  // Se nessun filtro è attivo, mostra tutto
  if (!statusFilter.all && !statusFilter.dChiamare && !statusFilter.inCorso && 
      !statusFilter.pratiRitiro && !statusFilter.esitoFinale) {
    statusFilter.all = true;
  }

  if (page <= 0 || limit <= 0) {
    res.status(400).json({ error: 'Parametri di paginazione non validi' });
    return;
  }

  // Limite massimo per evitare sovraccarichi
  if (limit > 100) {
    res.status(400).json({ error: 'Limite massimo: 100 elementi per pagina' });
    return;
  }

  try {
    console.log(`🔍 Fetching requests - Page: ${page}, Limit: ${limit}, Search: "${search || 'none'}", Filters:`, statusFilter);

    const [requests, total] = await Promise.all([
      getRequestsPaged(page, limit, search, statusFilter),
      getTotalRequestCount(search, statusFilter)
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(`📦 Found ${requests.length} requests (${total} total)`);

    res.status(200).json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      search: search || null,
      filters: statusFilter
    });
  } catch (error) {
    console.error('❌ Errore nel recupero richieste:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

/**
 * 🆕 GET /api/requests/status-counts
 * Restituisce i contatori per ogni stato
 */
export const getStatusCountsController: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const search = req.query.search as string | undefined;

  try {
    console.log(`📊 Fetching status counts - Search: "${search || 'none'}"`);

    const counts = await getStatusCounts(search);

    console.log('✅ Status counts retrieved:', counts);

    res.status(200).json({
      success: true,
      counts,
      search: search || null
    });
  } catch (error) {
    console.error('❌ Errore nel recupero contatori stati:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

/**
 * GET /api/request/:id
 * Restituisce i dettagli completi di una singola richiesta con gestione errori sicura.
 */
export const getRequest: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  try {
    console.log(`🔍 Fetching complete request with ID: ${id}`);

    // Recupera i dati base della richiesta
    const request = await getRequestById(id);

    if (!request) {
      console.log(`❌ Request not found: ${id}`);
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // ✅ Recupera dati correlati con gestione NULL sicura
    let statusHistory: RequestStatusRecord[] = [];
    let management: RequestManagementRecord | null = null;
    let offers: RequestOfferRecord[] = [];

    try {
      // 🎯 SEMPRE ritorna un management (anche se con defaults)
      management = await getManagementByRequestId(id);
      console.log(`✅ Management loaded with defaults if needed`);
    } catch (error) {
      console.warn(`⚠️ Could not load management: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // 🎯 Fallback con defaults
      management = {
        RequestId: id,
        Notes: '',
        RangeMin: 0,
        RangeMax: 0,
        RegistrationCost: 0,
        TransportCost: 0,
        PurchasePrice: 0,
        SalePrice: 0,
        RequestCloseReason: 0,
        FinalOutcome: undefined
      };
    }

    try {
      // 🎯 SEMPRE ritorna almeno uno stato (default "Da chiamare")
      statusHistory = await getStatusHistoryByRequestId(id);
      console.log(`✅ Status history loaded: ${statusHistory.length} records`);
    } catch (error) {
      console.warn(`⚠️ Could not load status history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // 🎯 Fallback con stato default
      statusHistory = [{
        Id: 0,
        RequestId: id,
        Status: 10, // Da chiamare
        ChangeDate: request.DateTime,
        Notes: undefined,
        FinalOutcome: undefined,
        CloseReason: undefined
      }];
    }

    try {
      // Prova a recuperare le offerte
      offers = await getOffersByRequestId(id);
      console.log(`✅ Offers loaded: ${offers.length} records`);
    } catch (error) {
      console.warn(`⚠️ Could not load offers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      offers = [];
    }

    // 🎯 Costruisce la risposta completa con tutti i dati SEMPRE presenti
    const completeRequest = {
      ...request,
      Management: management, // ✅ SEMPRE presente (mai null)
      Offers: offers,
      StatusHistory: statusHistory, // ✅ SEMPRE almeno 1 elemento
      CurrentStatus: statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : {
        Id: 0,
        RequestId: id,
        Status: 10,
        ChangeDate: request.DateTime,
        Notes: undefined
      }
    };

    console.log(`✅ Complete request assembled with NULL-safe defaults: ${id}`);
    res.status(200).json(completeRequest);
    
  } catch (error) {
    console.error('❌ Errore nel recupero richiesta completa:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/notes
 * Aggiorna le note di gestione per una richiesta.
 */
export const updateRequestNotes: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const { notes } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (typeof notes !== 'string') {
    res.status(400).json({ error: 'Note non valide' });
    return;
  }

  try {
    console.log(`📝 Updating notes for request ${requestId}`);

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Verifica se esiste già un record di management
    let management = await getManagementByRequestId(requestId);
    
    if (management) {
      // Aggiorna solo le note
      const updatedManagement = await upsertManagement({
        ...management,
        Notes: notes
      });
      res.status(200).json({
        success: true,
        management: updatedManagement,
        message: 'Note aggiornate con successo'
      });
    } else {
      // Crea un nuovo record di management con note e valori di default
      const newManagement = await upsertManagement({
        RequestId: requestId,
        Notes: notes,
        RangeMin: 0,
        RangeMax: 0,
        RegistrationCost: 0,
        TransportCost: 0,
        PurchasePrice: 0,
        SalePrice: 0,
        RequestCloseReason: 0
      });
      res.status(201).json({
        success: true,
        management: newManagement,
        message: 'Note create con successo'
      });
    }

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento note:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/pricing
 * Aggiorna prezzi e costi per una richiesta.
 */
export const updateRequestPricing: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const { purchasePrice, salePrice, registrationCost, transportCost } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  // Validazione dei prezzi - accetta anche 0 come valore valido
  if (purchasePrice !== undefined && (typeof purchasePrice !== 'number' || purchasePrice < 0 || isNaN(purchasePrice))) {
    res.status(400).json({ error: 'Prezzo di acquisto non valido' });
    return;
  }
  if (salePrice !== undefined && (typeof salePrice !== 'number' || salePrice < 0 || isNaN(salePrice))) {
    res.status(400).json({ error: 'Prezzo di vendita non valido' });
    return;
  }
  if (registrationCost !== undefined && (typeof registrationCost !== 'number' || registrationCost < 0 || isNaN(registrationCost))) {
    res.status(400).json({ error: 'Costi di pratica non validi' });
    return;
  }
  if (transportCost !== undefined && (typeof transportCost !== 'number' || transportCost < 0 || isNaN(transportCost))) {
    res.status(400).json({ error: 'Costi di trasporto non validi' });
    return;
  }

  try {
    console.log(`💰 Updating pricing for request ${requestId}:`, { purchasePrice, salePrice, registrationCost, transportCost });

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Verifica se esiste già un record di management
    let management = await getManagementByRequestId(requestId);
    
    if (management) {
      // Aggiorna solo i campi forniti
      const updatedManagement = await upsertManagement({
        ...management,
        PurchasePrice: purchasePrice !== undefined ? purchasePrice : management.PurchasePrice,
        SalePrice: salePrice !== undefined ? salePrice : management.SalePrice,
        RegistrationCost: registrationCost !== undefined ? registrationCost : management.RegistrationCost,
        TransportCost: transportCost !== undefined ? transportCost : management.TransportCost
      });
      res.status(200).json({
        success: true,
        management: updatedManagement,
        message: 'Prezzi e costi aggiornati con successo'
      });
    } else {
      // Crea un nuovo record di management con prezzi/costi e valori di default
      const newManagement = await upsertManagement({
        RequestId: requestId,
        Notes: '',
        RangeMin: 0,
        RangeMax: 0,
        PurchasePrice: purchasePrice || 0,
        SalePrice: salePrice || 0,
        RegistrationCost: registrationCost || 0,
        TransportCost: transportCost || 0,
        RequestCloseReason: 0
      });
      res.status(201).json({
        success: true,
        management: newManagement,
        message: 'Prezzi e costi creati con successo'
      });
    }

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento prezzi e costi:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/range
 * Aggiorna il range di valutazione per una richiesta.
 */
export const updateRequestRange: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const { rangeMin, rangeMax } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  // Validazione del range
  if (rangeMin !== undefined && (typeof rangeMin !== 'number' || rangeMin < 0 || isNaN(rangeMin))) {
    res.status(400).json({ error: 'Valore minimo range non valido' });
    return;
  }
  if (rangeMax !== undefined && (typeof rangeMax !== 'number' || rangeMax < 0 || isNaN(rangeMax))) {
    res.status(400).json({ error: 'Valore massimo range non valido' });
    return;
  }
  if (rangeMin !== undefined && rangeMax !== undefined && rangeMin > rangeMax) {
    res.status(400).json({ error: 'Il valore minimo non può essere maggiore del valore massimo' });
    return;
  }

  try {
    console.log(`📊 Updating range for request ${requestId}:`, { rangeMin, rangeMax });

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Verifica se esiste già un record di management
    let management = await getManagementByRequestId(requestId);
    
    if (management) {
      // Aggiorna solo il range
      const updatedManagement = await upsertManagement({
        ...management,
        RangeMin: rangeMin !== undefined ? rangeMin : management.RangeMin,
        RangeMax: rangeMax !== undefined ? rangeMax : management.RangeMax
      });
      res.status(200).json({
        success: true,
        management: updatedManagement,
        message: 'Range di valutazione aggiornato con successo'
      });
    } else {
      // Crea un nuovo record di management con range e valori di default
      const newManagement = await upsertManagement({
        RequestId: requestId,
        Notes: '',
        RangeMin: rangeMin || 0,
        RangeMax: rangeMax || 0,
        RegistrationCost: 0,
        TransportCost: 0,
        PurchasePrice: 0,
        SalePrice: 0,
        RequestCloseReason: 0
      });
      res.status(201).json({
        success: true,
        management: newManagement,
        message: 'Range di valutazione creato con successo'
      });
    }

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento range:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/vehicle
 * Aggiorna le informazioni del veicolo per una richiesta.
 */
export const updateRequestVehicle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const { 
    licensePlate, 
    km, 
    registrationYear, 
    engineSize, 
    fuelType, 
    transmissionType, 
    carCondition, 
    engineCondition,
    interiorConditions,
    exteriorConditions,
    mechanicalConditions
  } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  try {
    console.log(`🚗 Updating vehicle info for request ${requestId}`);
    console.log('📦 Dati ricevuti dal frontend:', req.body);

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Costruisce l'oggetto di aggiornamento solo con i campi forniti
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (licensePlate !== undefined) {
      updateFields.push(`"LicensePlate" = $${paramIndex++}`);
      updateValues.push(licensePlate);
    }
    if (km !== undefined) {
      updateFields.push(`"Km" = $${paramIndex++}`);
      updateValues.push(km);
    }
    if (registrationYear !== undefined) {
      updateFields.push(`"RegistrationYear" = $${paramIndex++}`);
      updateValues.push(registrationYear);
    }
    if (engineSize !== undefined) {
      updateFields.push(`"EngineSize" = $${paramIndex++}`);
      updateValues.push(engineSize);
    }
    if (fuelType !== undefined) {
      updateFields.push(`"FuelType" = ${paramIndex++}`);
      updateValues.push(fuelType);
    }
    if (transmissionType !== undefined) {
      updateFields.push(`"TransmissionType" = ${paramIndex++}`);
      updateValues.push(transmissionType);
    }
    if (carCondition !== undefined) {
      updateFields.push(`"CarCondition" = ${paramIndex++}`);
      updateValues.push(carCondition);
    }
    if (engineCondition !== undefined) {
      updateFields.push(`"EngineCondition" = ${paramIndex++}`);
      updateValues.push(engineCondition);
    }
    if (interiorConditions !== undefined) {
      updateFields.push(`"InteriorConditions" = ${paramIndex++}`);
      updateValues.push(interiorConditions);
    }
    if (exteriorConditions !== undefined) {
      updateFields.push(`"ExteriorConditions" = ${paramIndex++}`);
      updateValues.push(exteriorConditions);
    }
    if (mechanicalConditions !== undefined) {
      updateFields.push(`"MechanicalConditions" = ${paramIndex++}`);
      updateValues.push(mechanicalConditions);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'Nessun campo da aggiornare fornito' });
      return;
    }

    // Aggiunge l'ID della richiesta come ultimo parametro
    updateValues.push(requestId);

    const query = `
      UPDATE "Requests"
      SET ${updateFields.join(', ')}
      WHERE "Id" = ${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Recupera anche le immagini per la risposta completa
    const imagesQuery = `
      SELECT "Name" FROM "RequestImages" 
      WHERE "RequestId" = $1 
      ORDER BY "Id"
    `;
    const imagesResult = await pool.query(imagesQuery, [requestId]);
    const images = imagesResult.rows.map((row: any) => row.Name);

    const updatedRequest = {
      ...result.rows[0],
      Images: images
    };

    console.log(`✅ Vehicle info updated successfully for request ${requestId}`);
    res.status(200).json({
      success: true,
      request: updatedRequest,
      message: 'Informazioni veicolo aggiornate con successo'
    });

  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento informazioni veicolo:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/status
 * Cambia lo stato di una richiesta.
 */
export const changeRequestStatus: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const statusChange: StatusChangeRequest = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (!statusChange.NewStatus || typeof statusChange.NewStatus !== 'number') {
    res.status(400).json({ error: 'Nuovo stato non valido' });
    return;
  }

  try {
    console.log(`🔄 Changing status for request ${requestId}:`, statusChange);

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Prova ad aggiungere il nuovo stato
    try {
      const newStatus = await addStatusChange({
        ...statusChange,
        RequestId: requestId
      });

      // Se è un esito finale con sotto-stati, aggiorna anche il management
      if (statusChange.NewStatus === 40 && (statusChange.FinalOutcome || statusChange.CloseReason)) {
        try {
          await updateFinalOutcome(
            requestId,
            statusChange.FinalOutcome,
            statusChange.CloseReason
          );
        } catch (mgmtError) {
          console.warn(`⚠️ Could not update management outcome: ${mgmtError instanceof Error ? mgmtError.message : 'Unknown error'}`);
        }
      }

      console.log(`✅ Status changed successfully for request ${requestId}`);
      res.status(200).json({
        success: true,
        newStatus,
        message: 'Stato aggiornato con successo'
      });

    } catch (statusError) {
      console.error(`❌ Error adding status change: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`);
      res.status(500).json({ 
        error: 'Errore nell\'aggiornamento dello stato',
        details: statusError instanceof Error ? statusError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Errore nel cambio stato:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/request/:id/offers
 * Aggiunge una nuova offerta per una richiesta.
 */
export const addRequestOffer: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const { offerDescription, offerPrice } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (!offerDescription || typeof offerDescription !== 'string') {
    res.status(400).json({ error: 'Descrizione offerta non valida' });
    return;
  }

  if (typeof offerPrice !== 'number' || offerPrice < 0 || isNaN(offerPrice)) {
    res.status(400).json({ error: 'Prezzo offerta non valido' });
    return;
  }

  try {
    console.log(`💰 Aggiunta offerta per richiesta ${requestId}:`, { offerDescription, offerPrice });

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Aggiungi l'offerta
    const newOffer = await addOffer({
      RequestId: requestId,
      OfferDescription: offerDescription,
      OfferPrice: offerPrice,
      OfferDate: new Date().toISOString()
    });

    console.log(`✅ Offerta aggiunta con successo:`, newOffer);
    res.status(201).json({
      success: true,
      offer: newOffer,
      message: 'Offerta aggiunta con successo'
    });

  } catch (error) {
    console.error('❌ Errore nell\'aggiunta offerta:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/request/:id/offers/:offerId
 * Modifica un'offerta esistente.
 */
export const updateRequestOffer: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const offerId = parseInt(req.params.offerId);
  const { offerDescription, offerPrice } = req.body;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (isNaN(offerId) || offerId <= 0) {
    res.status(400).json({ error: 'ID offerta non valido' });
    return;
  }

  // Validazione campi opzionali
  if (offerDescription !== undefined && typeof offerDescription !== 'string') {
    res.status(400).json({ error: 'Descrizione offerta non valida' });
    return;
  }

  if (offerPrice !== undefined && (typeof offerPrice !== 'number' || offerPrice < 0 || isNaN(offerPrice))) {
    res.status(400).json({ error: 'Prezzo offerta non valido' });
    return;
  }

  try {
    console.log(`✏️ Modifica offerta ${offerId} per richiesta ${requestId}:`, { offerDescription, offerPrice });

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Modifica l'offerta
    const updatedOffer = await updateOffer(offerId, {
      OfferDescription: offerDescription,
      OfferPrice: offerPrice
    });

    if (!updatedOffer) {
      res.status(404).json({ error: 'Offerta non trovata' });
      return;
    }

    console.log(`✅ Offerta modificata con successo:`, updatedOffer);
    res.status(200).json({
      success: true,
      offer: updatedOffer,
      message: 'Offerta modificata con successo'
    });

  } catch (error) {
    console.error('❌ Errore nella modifica offerta:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/request/:id/offers/:offerId
 * Elimina un'offerta.
 */
export const deleteRequestOffer: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const offerId = parseInt(req.params.offerId);

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (isNaN(offerId) || offerId <= 0) {
    res.status(400).json({ error: 'ID offerta non valido' });
    return;
  }

  try {
    console.log(`🗑️ Eliminazione offerta ${offerId} per richiesta ${requestId}`);

    // Verifica che la richiesta esista
    const existingRequest = await getRequestById(requestId);
    if (!existingRequest) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Elimina l'offerta
    const deleted = await deleteOffer(offerId);

    if (!deleted) {
      res.status(404).json({ error: 'Offerta non trovata' });
      return;
    }

    console.log(`✅ Offerta eliminata con successo`);
    res.status(200).json({
      success: true,
      message: 'Offerta eliminata con successo'
    });

  } catch (error) {
    console.error('❌ Errore nell\'eliminazione offerta:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}