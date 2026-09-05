import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PORT variable (keep whatever definition your boilerplate provided)
const PORT = process.env.PORT || 3001;

// 1. Create the HTTP server to serve index.html
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// 2. Create the WebSocket server instance
const wss = new WebSocketServer({ server });

// 3. Register connection, message, and close listeners
wss.on('connection', (socket, req) => {
  // Parse username from URL query string
  const username = new URL(req.url, 'http://localhost').searchParams.get('username');

  // Immediately broadcast system message: user joined
  const joinMsg = JSON.stringify({ type: 'system', text: `${username} joined` });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(joinMsg);
    }
  });

  // Handle incoming chat messages
  socket.on('message', (message) => {
    const parsed = JSON.parse(message);
    const chatMsg = JSON.stringify({
      type: 'chat',
      username: parsed.username,
      text: parsed.text,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(chatMsg);
      }
    });
  });

  // Handle client disconnection
  socket.on('close', () => {
    const leaveMsg = JSON.stringify({ type: 'system', text: `${username} left` });
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(leaveMsg);
      }
    });
  });
});

// 4. Start the server
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:3001`);
});
