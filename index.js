var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

var players = {};
var online = 0;

server.listen(port, function() {
    console.log("Server listening at port %d", port);
});

app.use(express.static(__dirname + "/public"));

io.on("connection", function(socket) {
    ++online;

    function update_players() {
        io.emit("new player", {
            numPlayers: Object.keys(players).length,
            numOnline: online
        });
    }

    socket.on("enter", function() {
        update_players();
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
        update_players();
        socket.emit("login", {
            playerId: socket.id,
            player: players[socket.id],
        });

        var done = false;
        Object.keys(players).forEach((key) => {
            if (!done && key !== socket.id && players[key].opponent === "-1") {
                players[socket.id].opponent = key;
                players[key].opponent = socket.id;

                socket.broadcast.to(key).emit("match found", {
                    player: players[socket.id],
                    opponent: socket.id,
                });

                socket.emit("match found", {
                    player: players[key],
                    opponent: key,
                });

                done = true;
            }
        });
    });

    function disconnect() {
        delete players[socket.id];
        update_players();
    }

    socket.on("disconnect", function() {
        disconnect();
        --online;
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
