function generate_question() {
    var choice = getRandomInt(0, 3);

    var question = "";
    if (choice === 0) {
        // +
        var num1 = getRandomInt(2, 100);
        var num2 = getRandomInt(2, 100);
        question = num1 + " + " + num2;
    } else if (choice === 1) {
        // -
        var num1 = getRandomInt(2, 100);
        var num2 = getRandomInt(2, 100);
        question = num1 + num2 + " - " + num1;
    } else if (choice === 2) {
        // *
        var num1 = getRandomInt(2, 12);
        var num2 = getRandomInt(2, 100);
        question = num1 + " * " + num1;
    } else if (choice === 3) {
        // /
        var num1 = getRandomInt(2, 12);
        var num2 = getRandomInt(2, 100);
        question = num1 * num2 + " / " + num1;
    }
    return question;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = function() {
    this.generate_questions = function generate_questions(count) {
        var questions = [];
        for (var i = 0; i < count; i++) {
            var question = generate_question();
            questions.push(question);
        }
        return questions;
    };
};
