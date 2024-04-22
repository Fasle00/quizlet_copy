const express = require('express')
const router = express.Router()

const { body, validationResult } = require('express-validator')

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
			JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id;`)
	res.render('quizes.njk', { ...req.session.user, quizes })
	//res.json({ ...req.session.user, quizes })
})

// new quiz
router.get('/new', async function (req, res) {
	if (req.session.name === undefined) {
		return res.redirect('/login')
	}
	res.render('create_tweep.njk', req.session.user)
})
// create quiz
router.post('/',
	body('tweep').isLength({ min: 1, max: 255 }),
	async function (req, res) {
		if (!validationResult(req).isEmpty()) {
			return res.render('create_tweep.njk', { error: "Tweep was to long (max 255 characters)" })
		}
		try {
			const [id] = await pool.promise().query(`SELECT alea_lacta_est_user.id  from alea_lacta_est_user WHERE alea_lacta_est_user.name = '${req.session.name}'`)
			await pool.promise().query(`INSERT INTO alea_leacta_est_tweep (user_id, text) VALUES ('${id[0].id}', '${req.body.tweep}');`) // ${new Date().toISOString().slice(0,19).replace('T', ' ')}
			return res.redirect('/')

		} catch (error) {
			res.redirect('/')
		}
})

//search quiz
router.get('/search', async function (req, res) {
	let search = req.query.q
	console.log(search)
	const [quizes] = await pool.promise().query(
		`SELECT 
			fabian_flashcard_quiz.*, 
			fabian_flashcard_user.name as username 
		FROM 
			fabian_flashcard_quiz 
			JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id
		WHERE 
			fabian_flashcard_quiz.name LIKE '%${search}%';`)
	
	res.render('quizes.njk', { ...req.session.user, quizes })
	//res.json({ ...req.session.user, quizes })
})

// show one quiz
router.get('/:id', async function (req, res) {
	console.log(req.params.id)
	const [quiz] = await pool.promise().query(
		`SELECT 
			fabian_flashcard_quiz.*, 
			fabian_flashcard_user.name as username 
		FROM 
			fabian_flashcard_quiz 
			JOIN fabian_flashcard_user ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id
		WHERE 
			fabian_flashcard_quiz.id = ${req.params.id};`)
	const [questions] = await pool.promise().query(`
	SELECT
    *
FROM
    fabian_flashcard_question
WHERE
    fabian_flashcard_question.quiz_id = ${quiz[0].id};`)
	//res.json({ ...req.session.user, quiz, questions })
	res.render('quiz.njk', {...req.session.user, "quiz": quiz[0], questions})
})

module.exports = router