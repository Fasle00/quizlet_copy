const express = require('express')
const router = express.Router()

const { body, validationResult } = require('express-validator')

const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = require('../db')
const session = require('express-session');
const { redirect } = require('express/lib/response');

// show all quizes
router.get('/quiz', async function (req, res) {
	const [tweeps] = await pool.promise().query('SELECT * FROM alea_leacta_est_tweep JOIN alea_lacta_est_user ON alea_leacta_est_tweep.user_id = alea_lacta_est_user.id')
	res.render('tweeps.njk', { ...req.session.user, tweeps })
})
router.get('/quiz/:id', async function (req, res) {
	res.render('tweep.njk', req.session.user)
})

// new quiz
router.get('/quiz/new', async function (req, res) {
	if (req.session.name === undefined) {
		return res.redirect('/login')
	}
	res.render('create_tweep.njk', req.session.user)
})
// create quiz
router.post('/quiz',
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


module.exports = router