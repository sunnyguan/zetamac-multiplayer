var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var players = {};
var numPlayers = 0;

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
    var playerAdded = false;

    socket.on('add player', function(name) {
        players[socket.id] = {
            'id': socket.id,
            'name': name,
            'text': "",
            'question': "",
            'score': ''
        };

        ++numPlayers;
        playerAdded = true;

        socket.emit('login', {
            'playerId': socket.id,
            'players': players,
            'numPlayers': numPlayers
        });

        socket.broadcast.emit('player joined', {
            'player': players[socket.id],
            'numPlayers': numPlayers
        });
    });

    socket.on('disconnect', function() {
        if (playerAdded) {
            delete players[socket.id];

            --numPlayers;

            socket.broadcast.emit('player left', {
                'playerId': socket.id,
                'numPlayers': numPlayers
            });
        }
    });

    socket.on('update keyboard', function(keyboard) {
        players[socket.id].text = keyboard["text"];
        players[socket.id].question = keyboard["question"];
        players[socket.id].score = keyboard["score"];

        socket.emit('update positions', {
            'players': players
        });

        socket.broadcast.emit('update positions', {
            'players': players
        });
    });
});
