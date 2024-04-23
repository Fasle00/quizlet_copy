const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const pool = require('../db');
const session = require('express-session');
const { redirect } = require('express/lib/response');

// show all users
router.get('/', async function (req, res) {
	try {
		const [users] = await pool.promise().query('SELECT * FROM fabian_flashcard_user;');
		res.json(users);
	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
})

// create user
router.get('/new', async function (req, res) {
	res.render('create_account.njk');
})
// create user
router.post('/',
	body('email').isLength({ min: 2 }).isEmail(),
	body('username').isLength({ min: 4, max: 32 }),
	body('password').isLength({ min: 4, max: 32 }),
	body('city').isLength({ min: 2 }),
	body('state').isLength({ min: 4 }),
	body('zip').isLength({ min: 4 }),
	async function (req, res) {
		const valRes = validationResult(req);
		if (!valRes.isEmpty()) {
			console.log(valRes.errors);
			return res.render('create_account.njk', { error: "poggers test error" });
		}
		try {
			bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
				try {
					let responce = await pool.promise().query(`
					INSERT INTO
						fabian_flashcard_user (name, password, email)
					VALUES
						(
							'${req.body.username}',
							'${hash}',
							'${req.body.mail}'
						);`
					);
					console.log(responce);
					if (responce.errno === 1062) {
						res.render('create_account.njk', { error: "Username already taken" });
					}
					req.session.name = req.body.username;
					res.redirect(`/user/${req.body.username}`);
				} catch (error) {
					console.log(error);
				}
				
			})
			res.json(req.body);
		} catch (error) {
			return res.render('create_account.njk', { error: "Failed to create an account" });
		}
});

// update user
router.get('/:id/update', async function (req, res) {
	res.render('/update_user.njk');
});
// update user
router.post('/:id/update', async function (req, res) {
	res.redirect(`/user/:${req.session.username}`);
});

// delete user
router.post('/:id/delete', async function (req, res) {
	res.redirect('/');
});

// show user
router.get('/:id', async function (req, res) {
	if (req.session.name === undefined) {
		return res.redirect('/login');
	} else if (req.params.id !== req.session.name){
		res.redirect(`/user/${req.session.name}`);
	}

	const [quizes] = await pool.promise().query(`
	SELECT 
		fabian_flashcard_quiz.*, 
		fabian_flashcard_user.name as username 
	FROM 
		fabian_flashcard_quiz 
	JOIN 
		fabian_flashcard_user 
		ON fabian_flashcard_quiz.owner_id = fabian_flashcard_user.id 
		WHERE fabian_flashcard_user.name = '${req.session.name}';`
	);

	let user = {
		username: req.session.name,
		loggedIn: true,
	};

	req.session.user = user;
	//console.log(req.session.user);
	//console.log({ username: req.session.name });
	res.render('user.njk', {...req.session.user, quizes});
});


module.exports = router;