const express = require('express')
const router = express.Router()

const { body, validationResult } = require('express-validator')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = require('../db')
const session = require('express-session');
const { redirect } = require('express/lib/response');

// delete user
router.post('/user/:id/delete', async function (req, res) {
	res.redirect('/')
})

// show user
router.get('/user/:id', async function (req, res) {
	if (req.session.name === undefined) {
		return res.redirect('/login')
	}
	let user = {
		username: req.session.name,
		loggedIn: true,
	}
	req.session.user = user
	console.log(req.session.user)
	console.log({ username: req.session.name })
	res.render('user.njk', req.session.user)
})

// show all users
router.get('/users', async function (req, res) {
	try {
		const [users] = await pool.promise().query('SELECT * FROM alea_lacta_est_user')
		res.json(users)
	} catch (error) {
		console.log(error)
		res.sendStatus(500)
	}
})

// update user
router.get('/user/:id/update', async function (req, res) {
	res.render('/uppdate_user')
})
// update user
router.post('/user/:id/update', async function (req, res) {
	res.redirect(`/user/:${req.session.username}`)
})

// create user
router.get('/user/new', async function (req, res) {
	res.render('create_account.njk')
})
// create user
router.post('/user/:id',
	body('email').isLength({ min: 2 }).isEmail(),
	body('username').isLength({ min: 4, max: 32 }),
	body('password').isLength({ min: 4, max: 32 }),
	body('city').isLength({ min: 2 }),
	body('state').isLength({ min: 4 }),
	body('zip').isLength({ min: 4 }),
	async function (req, res) {
		if (!validationResult(req).isEmpty())
			return res.render('create_account.njk', { error: "poggers test error" })
		try {
			bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
				await pool.promise().query(`INSERT INTO alea_lacta_est_user (name, password, mail) VALUES
    ('${req.body.username}', '${hash/*brownies*/}', '${req.body.mail}');`)
			})
			res.json(req.body)
		} catch (error) {
			return res.render('create_account.njk', { error: "Failed to create an account" })
		}
})


module.exports = router