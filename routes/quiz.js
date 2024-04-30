const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = require('../db')
const session = require('express-session');
const { redirect } = require('express/lib/response');

// show all quizes
router.get('/', async function (req, res) {
	const [quizes] = await pool.promise().query(
		`SELECT 
			fabian_flashcard_quiz.*, 
			fabian_flashcard_user.name as username 
		FROM 
			fabian_flashcard_quiz 
			JOIN fabian_flashcard_user 
			ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id;`
	);

	res.render('quizes.njk', {
		...req.session.user,
		quizes
	});
});

// new quiz
router.get('/new', async function (req, res) {
	if (req.session.name === undefined) {
		return res.redirect('/login');
	}
	res.render('new_quiz.njk', req.session.user);
});
// create quiz
router.post('/',
	body('name').isLength({ min: 1, max: 255 }),
	body('description').isLength({ min: 1, max: 255 }),
	async function (req, res) {
		if (!validationResult(req).isEmpty()) {
			return res.render('create_tweep.njk', {
				error: "Tweep was to long (max 255 characters)"
			});
		}
		//res.json(req.body);
		
		try {
			const [id] = await pool.promise().query(`
			SELECT
				fabian_flashcard_user.id
			FROM
				fabian_flashcard_user
			WHERE fabian_flashcard_user.name = '${req.session.name}'`
			);

			const [quiz] = await pool.promise().query(`
			INSERT INTO
				fabian_flashcard_quiz (name, description, owner_id)
			VALUES
				('${req.body.name}', '${req.body.description}', ${id[0].id});`
			);

			const [quiz_id] = await pool.promise().query(`
			SELECT
				fabian_flashcard_quiz.id
			FROM
				fabian_flashcard_quiz
			WHERE
				fabian_flashcard_quiz.name = '${req.body.name}' AND fabian_flashcard_quiz.description = '${req.body.description}';`
			);

			for (let i = 0; i < req.body.question.length; i++) {
				const [question] = await pool.promise().query(`
				INSERT INTO
					fabian_flashcard_question (quiz_id, front, back)
				VALUES
					( ${quiz_id[0].id}, '${req.body.question[i]}', '${req.body.answer[i]}');`
				);
			}

			return res.redirect('/');
		} catch (error) {
			console.log(error);
			console.log(`error nr: ${error.errno}`);
			res.redirect('/');
		}
});

//search quiz
router.get('/search', async function (req, res) {
	let search = req.query.q;
	const [quizes] = await pool.promise().query(`
	SELECT 
		fabian_flashcard_quiz.*, 
		fabian_flashcard_user.name as username 
	FROM 
		fabian_flashcard_quiz 
		JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id
	WHERE 
		fabian_flashcard_quiz.name LIKE '%${search}%';`
	);
	
	res.render('quizes.njk', {
		...req.session.user,
		quizes
	});
});

// show one quiz
router.get('/:id', async function (req, res) {
	const [quiz] = await pool.promise().query(`
	SELECT 
		fabian_flashcard_quiz.*, 
		fabian_flashcard_user.name as username 
	FROM 
		fabian_flashcard_quiz 
		JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id
	WHERE 
		fabian_flashcard_quiz.id = ${req.params.id};`
	);
	const [questions] = await pool.promise().query(`
	SELECT
		*
	FROM
		fabian_flashcard_question
	WHERE
		fabian_flashcard_question.quiz_id = ${quiz[0].id};`
	);
	
	res.render('quiz.njk', {
		...req.session.user,
		"quiz": quiz[0],
		questions
	});
});

// update quiz
router.get('/:id/update', async function (req, res) {
	const [quiz] = await pool.promise().query(`
	SELECT 
		fabian_flashcard_quiz.*, 
		fabian_flashcard_user.name as username 
	FROM 
		fabian_flashcard_quiz 
		JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id
	WHERE 
		fabian_flashcard_quiz.id = ${req.params.id};`
	);
	const [questions] = await pool.promise().query(`
	SELECT
		*
	FROM
		fabian_flashcard_question
	WHERE
		fabian_flashcard_question.quiz_id = ${quiz[0].id};`
	);
	
	res.render('update_quiz.njk', {
		...req.session.user,
		"quiz": quiz[0],
		questions
	});
});
// update quiz
router.post('/:id/update', 
	body('name').isLength({ min: 1, max: 255 }),
	body('description').isLength({ min: 1, max: 255 }),
async function (req, res) {
	if (!validationResult(req).isEmpty()) {
		return res.render('update_quiz.njk', {
			error: "Tweep was to long (max 255 characters)"
		});
	}
	
	const [quiz] = await pool.promise().query(`
	UPDATE
		fabian_flashcard_quiz
	SET
		name = '${req.body.name}', description = '${req.body.description}'
	WHERE
		id = ${req.params.id};`
	);

	const [questions] = await pool.promise().query(`
	SELECT
		*
	FROM
		fabian_flashcard_question
	WHERE
		fabian_flashcard_question.quiz_id = ${req.params.id};`
	);

	if (req.body.question.length === questions.length) {
		for (let i = 0; i < req.body.question.length; i++) {
			const [question] = await pool.promise().query(`
			UPDATE
				fabian_flashcard_question
			SET
				front = '${req.body.question[i]}', back = '${req.body.answer[i]}'
			WHERE
				id = ${req.body.id[i]};`
			);
		}
	}
	
	if (req.body.question.length > questions.length) {
		for (let i = 0; i < questions.length; i++) {
			const [question] = await pool.promise().query(`
			UPDATE
				fabian_flashcard_question
			SET
				front = '${req.body.question[i]}', back = '${req.body.answer[i]}'
			WHERE
				id = ${req.body.id[i]};`
			);
		}
		for (let i = questions.length; i < req.body.question.length; i++) {
			const [question] = await pool.promise().query(`
			INSERT INTO
				fabian_flashcard_question (quiz_id, front, back)
			VALUES
				( ${req.params.id}, '${req.body.question[i]}', '${req.body.answer[i]}');`
			);
		}
	}
	
	res.redirect(`/quiz/${req.params.id}`);
});

module.exports = router