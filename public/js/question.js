let deleteQuestionBtn = document.querySelectorAll('.remove_question');

deleteQuestionBtn.forEach(button => {
	button.addEventListener('click', () => {
		let parent = button.parentElement;
		console.log(parent);
		parent.remove();
	});
});

const questionContainer = document.querySelector('.question_list');
const addBtn = document.querySelector('#add_question');

addBtn.addEventListener('click', () => {
	let li = document.createElement('li');
	li.classList.add('row');
	li.classList.add('g-3');
	let quest = document.createElement('div');
	quest.classList.add('col-5');
	quest.innerHTML = `<label for="question">Question</label>
	<textarea
	  id="question"
	  name="question"
	  class="form-control"
	  required
	></textarea>`;
	let ans = document.createElement('div');
	ans.classList.add('col-5');
	ans.innerHTML = `<label for="answer">Answer</label>
	<textarea
	  id="answer"
	  name="answer"
	  class="form-control"
	  required
	></textarea>`;
	let removeBtn = document.createElement('button');
	removeBtn.type = 'button';
	removeBtn.classList.add('col-2');
	removeBtn.classList.add('remove_question');
	removeBtn.innerHTML = 'Delete question';
	removeBtn.addEventListener('click', () => {
		li.remove();
	});
	li.appendChild(quest);
	li.appendChild(ans);
	li.appendChild(removeBtn);
	questionContainer.appendChild(li);
});