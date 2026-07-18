import http from 'http';
import app from './app';
import { initSockets } from './sockets';
import { initializeDatabaseSchema } from './config/initDb';
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Wire up our socket listeners
initSockets(server, CLIENT_URL);


async function startServer() {
  // Ensure table exists in Supabase
  await initializeDatabaseSchema();
  
  // Start Express/Socket server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
