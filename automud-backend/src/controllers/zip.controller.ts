import { Request, Response } from 'express';
import archiver from 'archiver';
import { BlobServiceClient } from '@azure/storage-blob';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME!;

export const downloadZip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'Nessun file specificato' });
      return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="galleria.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', err => {
      console.error('Errore durante la creazione ZIP:', err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (const blobName of files) {
      const blobClient = containerClient.getBlobClient(blobName);
      const downloadResponse = await blobClient.download();

      const buffer = await streamToBuffer(downloadResponse.readableStreamBody!);
      archive.append(buffer, { name: blobName });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Errore generale nel controller ZIP:', error);
    res.status(500).json({ error: 'Errore interno durante la generazione dello ZIP' });
  }
};

function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => chunks.push(Buffer.from(data)));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}