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
        const [users] = await pool.promise().query(`
        SELECT 
            * 
        FROM fabian_flashcard_user;`);
        res.json(users);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

// logout
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// create user
router.get('/new', async function (req, res) {
    res.render('create_account.njk', { 
        ...req.session.user, 
        title: `Create Account`,
    });
});
// create user
router.post('/',
    body('email').isLength({ min: 2 }).isEmail(),
    body('name').isLength({ min: 4, max: 32 }),
    body('password').isLength({ min: 4, max: 32 }),
    body('city').isLength({ min: 2 }),
    body('state').isLength({ min: 4 }),
    body('zip').isLength({ min: 4 }),
    async function (req, res) {
        const valRes = validationResult(req);
        if (!valRes.isEmpty()) {
            console.log(valRes.errors);
            return res.render('create_account.njk', {
                ...req.session.user,
                error: "poggers test error",
                title: `Create Account`,
            });
        }
        try {
            bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
                try {
                    let responce = await pool.promise().query(`
                    INSERT INTO
                        fabian_flashcard_user (name, password, email)
                    VALUES
                        (
                            '${req.body.name}',
                            '${hash}',
                            '${req.body.email}'
                        );`
                    );
                    console.log(responce);
                    req.session.name = req.body.name;
                    return res.redirect(`/user/${req.body.name}`);
                } catch (error) {
                    console.log(error);
                    console.log(`error nr: ${error.errno}`);
                    if (error.errno === 1062) {
                        console.log(req.body);
                        return res.render('create_account.njk', {
                            ...req.session.user,
                            title: `Create Account`,
                            error: "Username already taken",
                            ...req.body,
                        });
                    } else {
                        return res.render('create_account.njk', {
                            ...req.session.user,
                            title: `Create Account`,
                            error: "Failed to create an account",
                        });
                    }
                }
            })
        } catch (error) {
            return res.render('create_account.njk', {
                ...req.session.user,
                title: `Create Account`,
                error: "Failed to create an account",
            });
        }
    });

// update user
router.get('/:id/update',
    async function (req, res) {
        res.render('update_user.njk', { 
            ...req.session.user, 
            title: `Update Account`,
        });
    });
// update user
router.post('/:id/update',
    body('email').isLength({ min: 2 }).isEmail(),
    body('name').isLength({ min: 4, max: 32 }),
    body('password').isLength({ min: 4, max: 32 }),
    body('city').isLength({ min: 2 }),
    body('state').isLength({ min: 4 }),
    body('zip').isLength({ min: 4 }),
    async function (req, res) {

        // checks if the user is logged in
        // or if the user is trying to update another user
        if (req.session.name === undefined) {
            console.log("no session");
            return res.redirect('/login');
        } else if (req.params.id !== req.session.name) {
            console.log("wrong user");
            return res.redirect(`/user/${req.session.name}`);
        }

        // checks if the input is valid
        const valRes = validationResult(req);
        if (!valRes.isEmpty()) {
            console.log(valRes.errors);
            return res.render('update_user.njk', {
                ...req.session.user,
                title: `Update Account`,
                error: "poggers test error",
            });
        }

        try {
            // hashes the password
            bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
                try {

                    // updates the user and checks if the user is changing their name
                    let responce;
                    if (req.body.name === req.session.name) {
                        responce = await pool.promise().query(`
                    UPDATE
                        fabian_flashcard_user
                    SET
                        password = '${hash}',
                        email = '${req.body.email}'
                    WHERE
                        name = '${req.session.name}';`
                        );
                    } else {
                        responce = await pool.promise().query(`
                    UPDATE
                        fabian_flashcard_user
                    SET
                        name = '${req.body.name}',
                        password = '${hash}',
                        email = '${req.body.email}'
                    WHERE
                        name = '${req.session.name}';`
                        );
                    }

                    // sets the users session name to the new name
                    req.session.name = req.body.name;
                    return res.redirect(`/user/${req.body.name}`);
                } catch (error) {
                    console.log(error);
                    console.log(`error nr: ${error.errno}`);
                    if (error.errno === 1062) { // checks if the username is already taken
                        console.log(req.body);
                        return res.render('update_user.njk', {
                            error: "Username already taken",
                            ...req.body,
                        });
                    } else {
                        return res.render('update_user.njk', {
                            ...req.session.user,
                            title: `Update Account`,
                            error: "Failed to update your account",
                            ...req.body,
                        });
                    }
                }
            })
        } catch (error) {
            return res.render('create_account.njk', {
                ...req.session.user,
                title: `Update Account`,
                error: "Failed to create an account",
            });
        }
    });

// delete user
router.post('/:id/delete', async function (req, res) {
    try {
        const [user] = await pool.promise().query(`
        SELECT
            fabian_flashcard_user.id
        FROM
            fabian_flashcard_user
        WHERE fabian_flashcard_user.name = '${req.session.name}'`
        );
        const [quizes] = await pool.promise().query(`
        SELECT 
            *
        FROM
            fabian_flashcard_quiz WHERE owner_id = ?;`, [user[0].id]
        );
        await pool.promise().query(`
        DELETE FROM 
            fabian_flashcard_user 
        WHERE (\`name\` = '${req.session.name}');`
        );

        await pool.promise().query(`
        DELETE FROM 
            fabian_flashcard_quiz 
        WHERE (\`owner_id\` = '${req.session.name}');`
        );

        if (quizes.length === 0) {
            req.session.destroy();
            return res.redirect('/');
        }
        quizes.forEach(async quiz => {
            await pool.promise().query(`
            DELETE FROM 
                fabian_flashcard_question 
            WHERE (\`quiz_id\` = '${quiz.id}');`
            );
        });
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.redirect(`/user/${req.session.name}`);
    }
});

// show user
router.get('/:id', async function (req, res) {
    if (req.session.name === undefined) {
        return res.redirect('/login');
    } else if (req.params.id !== req.session.name) {
        return res.redirect(`/user/${req.session.name}`);
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

    let userQuizesID = [];
    for (let i = 0; i < quizes.length; i++) {
        userQuizesID.push(quizes[i].id);
    }

    req.session.user = user;
    res.render('user.njk', {
        ...req.session.user,
        title: `User`,
        quizes,
    });
});


module.exports = router;