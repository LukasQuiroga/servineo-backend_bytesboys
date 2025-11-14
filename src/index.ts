import Server from './config/server.config.js';
import _connect from './database.js';

import { SERVER_PORT } from './config/env.config.js';

async function startServer() {
  try {
    Server.listen(SERVER_PORT, () => {
      console.info(`Server running on http://localhost:${SERVER_PORT}`);
    });
  } catch (error) {
    console.error('Error starting server', error);
  }
}

_connect();
startServer();
