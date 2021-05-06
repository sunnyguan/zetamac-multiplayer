var socket = io();
var keyboard = { text: "", question: "", score: "0" };

var players = {};
var numPlayers = 0;
var playerId;
var playerName;

/* Keyboard events */

var question1 = document.getElementById("question1");
var question2 = document.getElementById("question2");

var textbox1 = document.getElementById("text1");
var textbox2 = document.getElementById("text2");

var score1 = document.getElementById("score1");
var score2 = document.getElementById("score2");

var name1 = document.getElementById("name1");
var name2 = document.getElementById("name2");

addEventListener("keydown", function(event) {
    if (event.keyCode == 13) {
        if (!playerName) startConnection();
    }
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function new_question() {
    var question = getRandomInt(0, 10) + " + " + getRandomInt(0, 10);
    question1.textContent = question;
    keyboard["question"] = question;
    socket.emit("update keyboard", keyboard);
}

function check() {
    var q = question1.textContent;
    if (!!q) {
        var ans = eval(q);
        if (ans === parseInt(textbox1.value)) {
            textbox1.value = "";
            score1.textContent = parseInt(score1.textContent) + 1 + "";
            keyboard["text"] = textbox1.value;
            keyboard["score"] = score1.textContent;
            socket.emit("update keyboard", keyboard);
            new_question();
        }
    }
}

addEventListener(
    "input",
    function(event) {
        if (playerName) {
            check();
            keyboard["text"] = textbox1.value;
            socket.emit("update keyboard", keyboard);
        }
    },
    false
);

var banner = document.getElementById("banner");
var game = document.getElementById("game");

var cap = 30;

function init_names() {
    console.log(players);
    Object.keys(players).forEach((key) => {
        if (key == playerId) {
            name1.textContent = players[key].name;
        } else {
            name2.textContent = players[key].name;
        }
    });
}

function start() {
    init_names();

    var time = cap + 5;
    var x = setInterval(function() {
        if (time >= cap + 2) {
            banner.textContent = time - cap - 1 + "..";
        } else if (time == cap + 1) {
            banner.textContent = "GO!";
        } else if (time == cap) {
            banner.textContent = time + "";
            textbox1.readOnly = false;
            new_question();
        } else if (time <= 0) {
            banner.textContent = "TIME!";
            textbox1.readOnly = true;
            socket.emit("game end");
            clearInterval(x);
        } else {
            banner.textContent = time + "";
        }
        time--;
    }, 1000);
}

/* Socket events */

socket.on("login", function(data) {
    numPlayers = data.numPlayers;
    playerId = data.playerId;
    players[playerId] = data.player;
    init_names();
});

var opponentId = -1;

socket.on("match found", function(data) {
    players[data.player.id] = data.player;
    numPlayers = data.numPlayers;
    opponentId = data.opponent;
    start();
});

socket.on("player left", function(data) {
    delete players[data.playerId];
    numPlayers = data.numPlayers;
});

socket.on("update positions", function(data) {
    players = data.players;
    Object.keys(players).forEach((key) => {
        if (key === opponentId) {
            textbox2.value = players[key].text;
            question2.textContent = players[key].question;
            score2.textContent = players[key].score;
        }
    });
});

/* Start connection */

var startConnection = function() {
    var startEl = document.getElementById("start");
    var playerEl = document.getElementById("player");
    playerName = playerEl.value + "'s";
    if (playerName) {
        document.body.removeChild(startEl);
        game.style.display = "block";
        socket.emit("add player", playerName);
    }
};