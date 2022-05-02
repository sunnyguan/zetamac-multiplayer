function generate_question() {
    let choice = getRandomInt(0, 3);

    let question = "";
    if (choice === 0) {
        // +
        let num1 = getRandomInt(2, 100);
        let num2 = getRandomInt(2, 100);
        question = num1 + " + " + num2;
    } else if (choice === 1) {
        // -
        let num1 = getRandomInt(2, 100);
        let num2 = getRandomInt(2, 100);
        question = num1 + num2 + " - " + num1;
    } else if (choice === 2) {
        // *
        let num1 = getRandomInt(2, 12);
        let num2 = getRandomInt(2, 100);
        question = num1 + " * " + num1;
    } else if (choice === 3) {
        // /
        let num1 = getRandomInt(2, 12);
        let num2 = getRandomInt(2, 100);
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
        let questions = [];
        for (let i = 0; i < count; i++) {
            let question = generate_question();
            questions.push(question);
        }
        return questions;
    };
};
