const http = require('http');
const app = require('./App.js');
const { init } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});