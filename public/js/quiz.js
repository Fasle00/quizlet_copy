const questions = document.querySelector('.question_list').children;
const quest = document.querySelector('.question_list');
const leftBtn = document.querySelector('.left');
const rightBtn = document.querySelector('.right');
const counter = document.querySelector('.counter');

let q1 = document.querySelector('.question_inner');
q1.addEventListener('click', () => {
    q1.classList.toggle('isFlipped');
})
/* 
let current = 1;
let question = questions[current - 1];
quest.addEventListener('click', () => {
    question.children[0].children[0].classList.toggle('hidden');
    question.children[0].children[1].classList.toggle('hidden');
})
document.addEventListener('DOMContentLoaded', () => {
    updateQuestions();
    //console.log('loaded');
});

quest.addEventListener('click', (e) => {
    if (e.target.classList.contains('list-group-item')) {
        updateQuestions();
    }
});

leftBtn.addEventListener('click', () => {
    if (current > 1) {
        current--;
        updateQuestions();
    }
});

rightBtn.addEventListener('click', () => {
    if (current < questions.length) {
        current++;
        updateQuestions();
    }
});

function updateQuestions() {
    updateCounter();
    updateQuestion();
    question.children[0].children[0].classList.remove('hidden');
    question.children[0].children[1].classList.add('hidden');
}
*/
function updateCounter() {
    counter.innerHTML = `${current}/${questions.length}`;
}
/*
function updateQuestion() {
    for (let i = 0; i < questions.length; i++) {
        if (i === current - 1) {
            questions[i].classList.remove('hidden');
            question = questions[i];
        } else {
            questions[i].classList.add('hidden');
        }
    }
} */