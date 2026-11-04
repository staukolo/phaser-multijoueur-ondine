const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

const players = {};

io.on('connection', (socket) => {
    console.log('Joueur connecté : ' + socket.id);

    players[socket.id] = {
        x: 100,
        y: 450,
        anim: 'turn'
    };

    socket.emit('currentPlayers', players);

    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        ...players[socket.id]
    });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id] = {
                x: data.x,
                y: data.y,
                anim: data.anim
            };
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                ...players[socket.id]
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Joueur déconnecté : ' + socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});