var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

var players = {};
var numPlayers = -1;

server.listen(port, function() {
    console.log("Server listening at port %d", port);
});

app.use(express.static(__dirname + "/public"));

io.on("connection", function(socket) {
    ++numPlayers;
    var playerAdded = true;

    socket.on("enter", function() {
        io.emit("new player", {
            numPlayers: numPlayers,
        });
    });

    socket.on("add player", function(name) {
        players[socket.id] = {
            id: socket.id,
            name: name,
            text: "",
            question: "",
            score: "",
            opponent: "-1",
        };
        socket.emit("login", {
            playerId: socket.id,
            player: players[socket.id],
            numPlayers: numPlayers,
        });

        var done = false;
        Object.keys(players).forEach((key) => {
            if (!done && key !== socket.id && players[key].opponent === "-1") {
                players[socket.id].opponent = key;
                players[key].opponent = socket.id;

                socket.broadcast.to(key).emit("match found", {
                    player: players[socket.id],
                    numPlayers: numPlayers,
                    opponent: socket.id,
                });

                socket.emit("match found", {
                    player: players[key],
                    numPlayers: numPlayers,
                    opponent: key,
                });

                socket.broadcast.emit("new player", {
                    numPlayers: numPlayers,
                });

                done = true;
            }
        });
    });

    function disconnect() {
        if (playerAdded) {
            delete players[socket.id];

            --numPlayers;

            socket.broadcast.emit("player left", {
                playerId: socket.id,
                numPlayers: numPlayers,
            });
        }
    }

    socket.on("disconnect", function() {
        disconnect();
    });

    socket.on("game end", function() {
        disconnect();
    });

    socket.on("update keyboard", function(keyboard) {
        players[socket.id].text = keyboard["text"];
        players[socket.id].question = keyboard["question"];
        players[socket.id].score = keyboard["score"];

        socket.emit("update positions", {
            players: players,
        });

        socket.broadcast.emit("update positions", {
            players: players,
        });
    });
});
