import app from './app';

// Porta del server (di default 3000 se non specificata nel .env)
const PORT = process.env.PORT || 3000;

// Avvio del server
app.listen(PORT, () => {
  console.log(`🟢 Server attivo su http://localhost:${PORT}`);
});
