const express = require('express')
const router = express.Router()

const { body, validationResult } = require('express-validator')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = require('../db')
const session = require('express-session');
const { redirect } = require('express/lib/response');


router.get('/', async function (req, res) {
	res.render('index.njk', req.session.user)
})

router.get('/login', async function (req, res) {
	res.render('login.njk', req.session.user)
})

router.post('/login',
	body('username').isLength({ min: 4, max: 32 }),
	body('password').isLength({ min: 4, max: 32 }),
	async function (req, res) {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.render('login.njk', { error: 'Username and password must be 4-32 characters long.' })
		}
		try {
			const [user] = await pool.promise().query(`SELECT * FROM fabian_flashcard_user WHERE fabian_flashcard_user.\`name\` = '${req.body.username}'`)
			console.log(user)
			console.log(user[0])
			console.log(user[0].password)

			bcrypt.compare(req.body.password, user[0].password, function (err, result) {
				console.log(result)
				if (result) {
					req.session.name = req.body.username
					res.redirect(`user/:${req.body.username}`)
				} else {
					res.render('login.njk', { username: req.body.username, error: 'wrong password', ...req.session.user })
				}
			})
		} catch (error) {
			console.log(error)
			res.render('login.njk', { error: 'wrong username', ...req.session.user })
		}
})

router.get('/hashtest', async function (req, res) {
	const myPlaintextPassword = 'test2';
	const someOtherPlaintextPassword = 'not_bacon';

	bcrypt.hash(myPlaintextPassword, saltRounds, function (err, hash) {
		console.log(hash)
		return res.json(hash)
	})
})

router.get('/about', async function (req, res) {
	res.render('about.njk', req.session.user)
})


module.exports = router