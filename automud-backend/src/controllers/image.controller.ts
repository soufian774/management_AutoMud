import { Request, Response, RequestHandler } from 'express';
import { BlobServiceClient } from '@azure/storage-blob';
import { pool } from '../db/pool';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configurazione Azure Blob Storage - ✅ SICURO: Usa variabili d'ambiente
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "automudformimages";

// ✅ VALIDAZIONE: Verifica che le variabili d'ambiente siano presenti
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('❌ AZURE_STORAGE_CONNECTION_STRING non trovata nelle variabili d\'ambiente');
}

if (!AZURE_CONTAINER_NAME) {
  throw new Error('❌ AZURE_CONTAINER_NAME non trovata nelle variabili d\'ambiente');
}

// Inizializza il client Azure Blob
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);

// Configurazione Multer per upload in memoria
const storage = multer.memoryStorage();

// Filtro per accettare solo immagini
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (mimeType && extName) {
    cb(null, true);
  } else {
    cb(new Error('Solo immagini sono permesse (JPEG, JPG, PNG, GIF, WebP)'));
  }
};

// Configurazione multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10 // Massimo 10 file per volta
  }
});

/**
 * POST /api/request/:id/images
 * Upload di nuove immagini per una richiesta
 */
export const uploadImages: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const files = req.files as Express.Multer.File[];

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Nessun file caricato' });
    return;
  }

  try {
    console.log(`📤 Upload di ${files.length} immagini per richiesta ${requestId}`);

    // Verifica che la richiesta esista
    const requestCheck = await pool.query('SELECT "Id" FROM "Requests" WHERE "Id" = $1', [requestId]);
    if (requestCheck.rows.length === 0) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    const uploadedImages = [];
    const errors = [];

    // Processa ogni file
    for (const file of files) {
      try {
        // Genera nome univoco mantenendo l'estensione
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        const blobName = `${requestId}/${uniqueName}`;

        console.log(`⬆️ Caricamento ${file.originalname} come ${uniqueName}`);

        // Upload su Azure Blob Storage
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: {
            blobContentType: file.mimetype
          }
        });

        // Salva nel database
        const dbResult = await pool.query(
          'INSERT INTO "RequestImages" ("RequestId", "Name") VALUES ($1, $2) RETURNING "Id"',
          [requestId, uniqueName]
        );

        uploadedImages.push({
          id: dbResult.rows[0].Id,
          name: uniqueName,
          originalName: file.originalname,
          size: file.size,
          url: `https://automudblobstorage.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobName}`
        });

        console.log(`✅ Immagine caricata: ${uniqueName}`);

      } catch (fileError) {
        console.error(`❌ Errore caricamento ${file.originalname}:`, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError instanceof Error ? fileError.message : 'Errore sconosciuto'
        });
      }
    }

    // Risposta con risultati
    const response: any = {
      success: true,
      message: `${uploadedImages.length} immagini caricate con successo`,
      uploaded: uploadedImages,
      requestId
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message += `, ${errors.length} errori`;
    }

    res.status(uploadedImages.length > 0 ? 201 : 400).json(response);

  } catch (error) {
    console.error('❌ Errore nell\'upload immagini:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/request/:id/images
 * Ottiene l'elenco delle immagini per una richiesta
 */
export const getImages: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  try {
    console.log(`📋 Recupero immagini per richiesta ${requestId}`);

    // Verifica che la richiesta esista
    const requestCheck = await pool.query('SELECT "Id" FROM "Requests" WHERE "Id" = $1', [requestId]);
    if (requestCheck.rows.length === 0) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Recupera immagini dal database
    const result = await pool.query(
      'SELECT "Id", "Name" FROM "RequestImages" WHERE "RequestId" = $1 ORDER BY "Id"',
      [requestId]
    );

    const images = result.rows.map(row => ({
      id: row.Id,
      name: row.Name,
      url: `https://automudblobstorage.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${requestId}/${row.Name}`
    }));

    console.log(`✅ Trovate ${images.length} immagini`);

    res.status(200).json({
      success: true,
      requestId,
      count: images.length,
      images
    });

  } catch (error) {
    console.error('❌ Errore nel recupero immagini:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * DELETE /api/request/:id/images/:imageId
 * Elimina una specifica immagine
 */
export const deleteImage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const imageId = parseInt(req.params.imageId);

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (isNaN(imageId) || imageId <= 0) {
    res.status(400).json({ error: 'ID immagine non valido' });
    return;
  }

  try {
    console.log(`🗑️ Eliminazione immagine ${imageId} per richiesta ${requestId}`);

    // Recupera info immagine
    const imageResult = await pool.query(
      'SELECT "Name" FROM "RequestImages" WHERE "Id" = $1 AND "RequestId" = $2',
      [imageId, requestId]
    );

    if (imageResult.rows.length === 0) {
      res.status(404).json({ error: 'Immagine non trovata' });
      return;
    }

    const imageName = imageResult.rows[0].Name;
    const blobName = `${requestId}/${imageName}`;

    // Elimina da Azure Blob Storage
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log(`✅ Blob eliminato: ${blobName}`);
    } catch (blobError) {
      console.warn(`⚠️ Errore eliminazione blob ${blobName}:`, blobError);
      // Continua comunque con l'eliminazione dal database
    }

    // Elimina dal database
    const deleteResult = await pool.query(
      'DELETE FROM "RequestImages" WHERE "Id" = $1 AND "RequestId" = $2',
      [imageId, requestId]
    );

    if (deleteResult.rowCount === 0) {
      res.status(404).json({ error: 'Immagine non trovata nel database' });
      return;
    }

    console.log(`✅ Immagine eliminata: ${imageName}`);

    res.status(200).json({
      success: true,
      message: 'Immagine eliminata con successo',
      imageId,
      imageName
    });

  } catch (error) {
    console.error('❌ Errore nell\'eliminazione immagine:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * DELETE /api/request/:id/images
 * Elimina tutte le immagini di una richiesta
 */
export const deleteAllImages: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  try {
    console.log(`🗑️ Eliminazione di tutte le immagini per richiesta ${requestId}`);

    // Verifica che la richiesta esista
    const requestCheck = await pool.query('SELECT "Id" FROM "Requests" WHERE "Id" = $1', [requestId]);
    if (requestCheck.rows.length === 0) {
      res.status(404).json({ error: 'Richiesta non trovata' });
      return;
    }

    // Recupera tutte le immagini
    const imagesResult = await pool.query(
      'SELECT "Id", "Name" FROM "RequestImages" WHERE "RequestId" = $1',
      [requestId]
    );

    if (imagesResult.rows.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Nessuna immagine da eliminare',
        deletedCount: 0
      });
      return;
    }

    let deletedFromBlob = 0;
    let errors = [];

    // Elimina da Azure Blob Storage
    for (const image of imagesResult.rows) {
      try {
        const blobName = `${requestId}/${image.Name}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        deletedFromBlob++;
        console.log(`✅ Blob eliminato: ${blobName}`);
      } catch (blobError) {
        console.warn(`⚠️ Errore eliminazione blob ${image.Name}:`, blobError);
        errors.push({
          imageName: image.Name,
          error: blobError instanceof Error ? blobError.message : 'Errore blob'
        });
      }
    }

    // Elimina dal database
    const deleteResult = await pool.query(
      'DELETE FROM "RequestImages" WHERE "RequestId" = $1',
      [requestId]
    );

    console.log(`✅ Eliminate ${deleteResult.rowCount} immagini dal database`);

    res.status(200).json({
      success: true,
      message: `${deleteResult.rowCount} immagini eliminate con successo`,
      deletedFromDatabase: deleteResult.rowCount || 0,
      deletedFromBlob,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Errore nell\'eliminazione immagini:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/request/:id/images/:imageId/replace
 * Sostituisce una specifica immagine
 */
export const replaceImage: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const imageId = parseInt(req.params.imageId);
  const file = req.file;

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (isNaN(imageId) || imageId <= 0) {
    res.status(400).json({ error: 'ID immagine non valido' });
    return;
  }

  if (!file) {
    res.status(400).json({ error: 'Nessun file caricato' });
    return;
  }

  try {
    console.log(`🔄 Sostituzione immagine ${imageId} per richiesta ${requestId}`);

    // Recupera info immagine esistente
    const imageResult = await pool.query(
      'SELECT "Name" FROM "RequestImages" WHERE "Id" = $1 AND "RequestId" = $2',
      [imageId, requestId]
    );

    if (imageResult.rows.length === 0) {
      res.status(404).json({ error: 'Immagine non trovata' });
      return;
    }

    const oldImageName = imageResult.rows[0].Name;
    const oldBlobName = `${requestId}/${oldImageName}`;

    // Genera nuovo nome mantenendo l'estensione
    const newImageName = `${uuidv4()}${path.extname(file.originalname)}`;
    const newBlobName = `${requestId}/${newImageName}`;

    // Upload nuova immagine su Azure
    const blockBlobClient = containerClient.getBlockBlobClient(newBlobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype
      }
    });

    console.log(`✅ Nuova immagine caricata: ${newBlobName}`);

    // Aggiorna database
    await pool.query(
      'UPDATE "RequestImages" SET "Name" = $1 WHERE "Id" = $2 AND "RequestId" = $3',
      [newImageName, imageId, requestId]
    );

    // Elimina vecchia immagine da Azure (opzionale, non blocca se fallisce)
    try {
      const oldBlockBlobClient = containerClient.getBlockBlobClient(oldBlobName);
      await oldBlockBlobClient.delete();
      console.log(`✅ Vecchia immagine eliminata: ${oldBlobName}`);
    } catch (deleteError) {
      console.warn(`⚠️ Errore eliminazione vecchia immagine:`, deleteError);
    }

    res.status(200).json({
      success: true,
      message: 'Immagine sostituita con successo',
      imageId,
      oldName: oldImageName,
      newName: newImageName,
      url: `https://automudblobstorage.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${newBlobName}`
    });

  } catch (error) {
    console.error('❌ Errore nella sostituzione immagine:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/request/:id/images/:imageId/info
 * Ottiene informazioni dettagliate su una specifica immagine
 */
export const getImageInfo: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const requestId = req.params.id;
  const imageId = parseInt(req.params.imageId);

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({ error: 'ID richiesta non valido' });
    return;
  }

  if (isNaN(imageId) || imageId <= 0) {
    res.status(400).json({ error: 'ID immagine non valido' });
    return;
  }

  try {
    console.log(`ℹ️ Info immagine ${imageId} per richiesta ${requestId}`);

    // Recupera info dal database
    const imageResult = await pool.query(
      'SELECT "Id", "Name" FROM "RequestImages" WHERE "Id" = $1 AND "RequestId" = $2',
      [imageId, requestId]
    );

    if (imageResult.rows.length === 0) {
      res.status(404).json({ error: 'Immagine non trovata' });
      return;
    }

    const image = imageResult.rows[0];
    const blobName = `${requestId}/${image.Name}`;

    // Recupera info da Azure Blob (opzionale)
    let blobInfo = null;
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      
      blobInfo = {
        size: properties.contentLength,
        contentType: properties.contentType,
        lastModified: properties.lastModified,
        etag: properties.etag
      };
    } catch (blobError) {
      console.warn(`⚠️ Errore recupero info blob:`, blobError);
    }

    res.status(200).json({
      success: true,
      image: {
        id: image.Id,
        name: image.Name,
        requestId,
        url: `https://automudblobstorage.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobName}`,
        blobInfo
      }
    });

  } catch (error) {
    console.error('❌ Errore nel recupero info immagine:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};