// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the EJS view
app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs file
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('locationUpdate', (location) => {
        console.log(`Location received: Latitude ${location.latitude}, Longitude ${location.longitude}`);
        // Broadcast the location to all connected clients
        io.emit('updateMap', location);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
