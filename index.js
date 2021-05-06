var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

var players = {};
var online = 0;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate_question() {
    var question = getRandomInt(0, 10) + " + " + getRandomInt(0, 10);
    return question;
}

function generate_questions(count) {
    var questions = [];
    for (var i = 0; i < count; i++) {
        var question = generate_question();
        questions.push(question);
    }
    return questions;
}

function update_players() {
    io.emit("new player", {
        numPlayers: Object.keys(players).length,
        numOnline: online
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
                questions = generate_questions(100);

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
