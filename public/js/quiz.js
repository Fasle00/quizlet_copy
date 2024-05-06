const questions = document.querySelector('.list-group').children;
const quest = document.querySelector('.list-group');
const leftBtn = document.querySelector('.left');
const rightBtn = document.querySelector('.right');
const counter = document.querySelector('.counter');

let current = 1;
let question = questions[current - 1];
quest.addEventListener('click', () => {
	question.children[0].classList.toggle('hidden');
	question.children[1].classList.toggle('hidden');
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
	question.children[0].classList.remove('hidden');
	question.children[1].classList.add('hidden');
}

function updateCounter() {
	counter.innerHTML = `${current}/${questions.length}`;
}

function updateQuestion() {
	for (let i = 0; i < questions.length; i++) {
		if (i === current - 1) {
			questions[i].classList.remove('hidden');
			question = questions[i];
		} else {
			questions[i].classList.add('hidden');
		}
	}
}