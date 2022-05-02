const socket = io();
socket.emit("enter");

// player state
var keyboard = { text: "", question: "", score: "0" };

// game information
var players = {};
var numPlayers = 0;
var playerId;
var playerName;
var questions = [];
var question_id = 0;
var games = {};
var cap = 30;
var opponentId = -1;

// spectating info
var spectating = 0;
var spec_id1 = -1;
var spec_id2 = -1;

// DOM elements
var question1 = document.getElementById("question1");
var question2 = document.getElementById("question2");

var textbox1 = document.getElementById("text1");
var textbox2 = document.getElementById("text2");

var score1 = document.getElementById("score1");
var score2 = document.getElementById("score2");

var name1 = document.getElementById("name1");
var name2 = document.getElementById("name2");

var speech_button = document.getElementById("enable-speech");
var speech = 0;

var banner = document.getElementById("banner");
var game = document.getElementById("game");
var newGame = document.getElementById("new-game");

var online_counter = document.getElementById("online");
var list_games = document.getElementById("games");
var highScore = document.getElementById("high-score");

////

var startGame = function() {
    newGame.style.display = "none";
    textbox1.value = "";
    textbox2.value = "";
    name2.textContent = "Waiting...";
    question1.textContent = "? + ?";
    question2.textContent = "? + ?";
    banner.textContent = "Waiting for opponent...";
    score1.textContent = "0";
    score2.textContent = "0";
    myChart.data.datasets[0].data = Array(cap).fill(null);
    myChart.data.datasets[1].data = Array(cap).fill(null);
    myChart.update();
    players = {};
    keyboard = { text: "", question: "", score: "0" };
    updatedLabels = false;
        // myChart.destroy();
    // myChart = new Chart(
    //     document.getElementById('graph'),
    //     config
    // );
    socket.emit("add player", lastName);
}

const labels = [];

for (let i = 0; i <= cap; i++) {
    labels.push(i);
}

var data = {
    labels: labels,
    datasets: [
        {
            label: "Player 1",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            data: Array(cap).fill(null),
        },
        {
            label: "Player 2",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(192,75,192,0.4)",
            borderColor: "rgba(192,75,192,1)",
            data: Array(cap).fill(null),
        }
    ]
};

let config = {
    type: 'line',
    data: data,
    options: {
        showLines: true,
        responsive: true
    }
};

let myChart = new Chart(
    document.getElementById('graph'),
    config
);

////

function digitRead(input) {
    if (textbox1.readOnly) {
        console.log("game has not been started yet!");
    } else {
        var lower = input.toLowerCase().replaceAll(" ", "");
        textbox1.value += lower;
        inputEvent({});
    }
}

function start_speech() {
    var commands = {
        ":digit": {
            regexp: /^((?:(?:\d) *)+)$/,
            callback: digitRead,
        },
        no: function() {
            textbox1.value = "";
        },
    };
    // annyang.debug(true);
    annyang.addCommands(commands);
    annyang.start();
}

function enable_speech() {
    if (annyang) {
        if (speech === 1) {
            annyang.abort();
            speech = -1;
            speech_button.textContent = "Enable Speech";
        } else {
            start_speech();
            speech = 1;
            speech_button.textContent = "Disable Speech";
        }
    }
    console.log(speech);
}

addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
        if (!playerName) startConnection();
    }
});

function new_question() {
    var question = questions[question_id++];
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

function inputEvent(e) {
    if (playerName) {
        check();
        keyboard["text"] = textbox1.value;
        socket.emit("update keyboard", keyboard);
    }
}

addEventListener("input", inputEvent, false);


function init_names() {
    Object.keys(players).forEach((key) => {
        if (key === playerId) {
            name1.textContent = players[key].name;
        } else {
            name2.textContent = players[key].name;
        }
    });
}

// socket events
socket.on("login", function(data) {
    playerId = data.playerId;
    players[playerId] = data.player;
    cap = data.cap;
    init_names();
});


socket.on("highScore", function(data) {
    highScore.textContent = `High Score: ${data.score} by ${data.player}`;
});


socket.on("match found", function(data) {
    players[data.player.id] = data.player;
    opponentId = data.opponent;
    questions = data.questions;
    score1.textContent = "0";
    init_names();
});


function createElementFromHTML(htmlString) {
    var div = document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}


function spectate(id, id2) {
    if (spectating === 0) {
        socket.emit("spectate", { id: id });
        spec_id1 = id;
        spec_id2 = id2;
        console.log("now spectating " + id + " and " + id2);
        startSpectating();
        spectating = 1;
    }
}

socket.on("update games", function(data) {
    games = data.games;
    list_games.innerHTML = "";
    Object.keys(games).forEach((id) => {
        var info = games[id];
        var element = createElementFromHTML(`
            <div class="bg-blue-200 shadow-md rounded-xl p-2 text-center cursor-pointer hover:bg-blue-300" onclick="spectate('${id}', '${info.id2}')">
                ${info.name1} vs ${info.name2}
            </div>
            `);
        list_games.appendChild(element);
    });
});


function update_online(count) {
    numPlayers = count.numPlayers;
    online = count.numOnline;
    online_counter.textContent = "Online: " + online + ", in game: " + numPlayers;
}

socket.on("new player", function(data) {
    update_online(data);
});

let time = 0;

socket.on("tick", function(data) {
    time = data.time;
    if (cap - time !== 0) {
        for (let i = 0; i < 2; i++) {
            myChart.data.datasets[i].data[cap - time] = myChart.data.datasets[i].data[cap - time - 1];
        }
        myChart.update();
    }
    if (time >= cap + 2) {
        banner.textContent = time - cap - 1 + "..";
    } else if (time === cap + 1) {
        banner.textContent = "GO!";
    } else if (time === cap) {
        banner.textContent = time + "";
        if (spectating !== 1) textbox1.readOnly = false;
        new_question();
    } else if (time <= 0) {
        var final_score1 = parseInt(score1.textContent);
        var final_score2 = parseInt(score2.textContent);
        if (final_score1 < final_score2) {
            banner.textContent =
                name2.textContent + " won!";
        } else if (final_score1 > final_score2) {
            banner.textContent =
                name1.textContent + " won!";
        } else {
            banner.textContent = "Tied game!";
        }

        textbox1.readOnly = true;
        newGame.style.display = "block";
        socket.emit("game end");
    } else {
        banner.textContent = time + "";
    }
});

socket.on("update positions", function(data) {
    players = data.players;

    Object.keys(players).forEach((key) => {
        if (spectating === 1) {
            if (key === spec_id1) {
                name1.textContent = players[spec_id1].name;
                textbox1.value = players[key].text;
                question1.textContent = players[key].question;
                score1.textContent = players[key].score;
                addPoint(0, players[key].score);
            } else if (key === spec_id2) {
                name2.textContent = players[spec_id2].name;
                textbox2.value = players[key].text;
                question2.textContent = players[key].question;
                score2.textContent = players[key].score;
                addPoint(1, players[key].score);
            }
        } else {
            if (key === opponentId) {
                textbox2.value = "*".repeat((players[key].text).length);
                question2.textContent = players[key].question;
                score2.textContent = players[key].score;
                addPoint(1, players[key].score);
            } else if (key === playerId) {
                addPoint(0, players[key].score);
            }
        }
    });
});

let updatedLabels = false;

function addPoint(pid, point) {
    if (!updatedLabels) {
        myChart.data.datasets[0].label = name1.textContent;
        myChart.data.datasets[1].label = name2.textContent;
        updatedLabels = true;
    }
    myChart.data.datasets[pid].data[cap - time] = point;
    myChart.update();
}

/* Start connection */

var lastName = "guest";

var startConnection = function() {
    spectating = -1; // disable spectating

    var startEl = document.getElementById("start");
    var playerEl = document.getElementById("player");
    playerName = playerEl.value;
    if (playerName) {
        document.getElementById("parent").removeChild(startEl);
        game.style.display = "block";
        socket.emit("add player", playerName);
        lastName = playerName;
    }
};

const startSpectating = function() {
    const startEl = document.getElementById("start");
    document.getElementById("parent").removeChild(startEl);
    game.style.display = "block";
    textbox2.type = "text";
};
