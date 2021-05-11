require('dotenv').config();
require('./utils')();

const API_URL = process.env.API_URL;
const fetch = require("node-fetch");

var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

var players = {};
var games = {};
var online = 0;

var CAP = 30;

function update_players() {
    io.emit("new player", {
        numPlayers: Object.keys(players).length,
        numOnline: online
    });
}

function update_games() {
    io.emit("update games", {
        games: games
    });
}

function game_end(game_data) {
    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(game_data)
    }).then(r => r.json()).then(res => {
        console.log(res);
    });
}

server.listen(port, function() {
    console.log("Server listening at port %d", port);
});

app.use(express.static(__dirname + "/public"));

io.on("connection", function(socket) {
    ++online;

    socket.on("enter", function() {
        update_players();
        fetch(API_URL).then(r => r.json()).then(res => {
            socket.emit("highScore", res);
        });
    });

    socket.on("spectate", function(info) {
        var id = info.id;
        if (id in games) {
            games[id].spectators.push(socket.id);
        } else {
            console.error("Game does not exist!");
        }
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
            cap: CAP
        });

        var done = false;
        Object.keys(players).forEach((key) => {
            if (!done && key !== socket.id && players[key].opponent === "-1") {
                // found a match between player "key" and "socket.id"
                players[socket.id].opponent = key;
                players[key].opponent = socket.id;

                questions = generate_questions(CAP * 3);

                games[key] = {
                    name1: name,
                    name2: players[key].name,
                    id2: socket.id,
                    spectators: []
                };
                update_games();

                socket.broadcast.to(key).emit("match found", {
                    player: players[socket.id],
                    opponent: socket.id,
                    questions: questions
                });

                socket.emit("match found", {
                    player: players[key],
                    opponent: key,
                    questions: questions
                });

                var time = CAP + 5;
                var x = setInterval(function() {
                    if (time <= 0) {
                        game_end({
                            'gameId': `${key}:${socket.id}:${new Date().getTime()}`,
                            'player1': players[socket.id].name,
                            'player2': players[key].name,
                            'score1': parseInt(players[socket.id].score),
                            'score2': parseInt(players[key].score)
                        });
                        clearInterval(x);
                    }
                    socket.emit("tick", { time: time });
                    socket.broadcast.to(key).emit("tick", { time: time });

                    // update to spectators as well
                    if (key in games) {
                        games[key].spectators.forEach(spectator => {
                            socket.broadcast.to(spectator).emit("tick", { time: time });
                        });
                    }

                    time--;
                }, 1000);

                done = true;
            }
        });
    });

    function disconnect() {
        if (socket.id in games)
            delete games[socket.id];
        if (players[socket.id])
            delete games[players[socket.id].opponent];
        update_games();

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
        if (!(socket.id in players)) return;
        players[socket.id].text = keyboard["text"];
        players[socket.id].question = keyboard["question"];
        players[socket.id].score = keyboard["score"];

        socket.emit("update positions", {
            players: players,
        });

        socket.broadcast.to(players[socket.id].opponent).emit("update positions", {
            players: players,
        });

        if (socket.id in games) {
            games[socket.id].spectators.forEach(spectator => {
                socket.broadcast.to(spectator).emit("update positions", { players: players });
            });
        } else if (players[socket.id].opponent in games) {
            games[players[socket.id].opponent].spectators.forEach(spectator => {
                socket.broadcast.to(spectator).emit("update positions", { players: players });
            });
        }
    });
});
