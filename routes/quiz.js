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
        quizes,
        title: `Quizes`
    });
});

// new quiz
router.get('/new', async function (req, res) {
    //if (req.session.name === undefined) {
    //    return res.redirect('/login');
    //}
    res.render('new_quiz.njk', {...req.session.user, title: `New Quiz`});
});
// create quiz
router.post('/',
    body('name').isLength({ min: 4, max: 255 }),
    body('description').isLength({ min: 10, max: 255 }), // optional
    body('question').isLength({ min: 1, max: 255 }),
    body('answer').isLength({ min: 1, max: 255 }),
    async function (req, res) {
        /*if (req.session.name === undefined) {
            return res.redirect('/login');
        }*/

        if (typeof (req.body.question) === 'string') {
            req.body.question = [req.body.question];
            req.body.answer = [req.body.answer];
        }

        if (!validationResult(req).isEmpty()) {
            let errors = validationResult(req).array();
            console.log(errors);

            console.log("rewriting errors")
            let output = [];
            for (let i = 0; i < errors.length; i++) {
                if (errors[i].path === 'name') {
                    errors[i].msg = "Name was to short or long (min 4 max 255 characters)";
                    output.push({ param: 'name', msg: "Name was to short or long (min 4 max 255 characters)" })
                }
                if (errors[i].path === 'description') {
                    errors[i].msg = "Description was to short or long (min 10 max 255 characters)";
                    output.push({ param: 'description', msg: "Description was to short or long (min 10 max 255 characters)" })
                }/*
                if (errors[i].path === 'question') {
                    errors[i].msg = "Question was to short or long (min 1 max 255 characters)";
                }
                if (errors[i].path === 'answer') {
                    errors[i].msg = "Answer was to short or long (min 1 max 255 characters)";
                }*/
            }

            let questOutput = [];

            for (let i = 0; i < req.body.question.length; i++) {
                if (req.body.question[i].length < 1 || req.body.question[i].length > 255) {
                    errors.push({ 
                        param: 'question', 
                        msg: `Question ${i + 1} was to short or long (min 1 max 255 characters)` 
                    });
                    output.push({ 
                        param: 'question', 
                        msg: `Question ${i + 1} was to short or long (min 1 max 255 characters)` 
                    });
                    questOutput.push({ 
                        param: 'question', 
                        msg: `Question ${i + 1} was to short or long (min 1 max 255 characters)`,
                        index: i,
                    });
                }
                if (req.body.answer[i].length < 1 || req.body.answer[i].length > 255) {
                    errors.push({ 
                        param: 'answer', 
                        msg: `Answer ${i + 1} was to short or long (min 1 max 255 characters)` 
                    });
                    output.push({ 
                        param: 'answer', 
                        msg: `Answer ${i + 1} was to short or long (min 1 max 255 characters)` 
                    });
                    questOutput.push({ 
                        param: 'answer', 
                        msg: `Answer ${i + 1} was to short or long (min 1 max 255 characters)`, 
                        index: i,
                    });
                }
            }
            if (req.body.question.length !== req.body.answer.length) {
                errors.push({ param: 'question', msg: "Question and Answer don't match" });
                output.push({ param: 'question', msg: "Question and Answer don't match" });
            }
            console.log(errors);
            console.log("output")
            console.log(output);
            console.log("questOutput")
            console.log(questOutput);
            //console.log(req.body);

            return res.render('new_quiz.njk', {
                ...req.session.user,
                error: output,
                ...req.body,
                title: `New Quiz`
            });
        }
        return res.json(req.body);

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
        quizes,
        title: `Quizes`
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
        questions,
        title: `${quiz[0].name}`
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
        questions,
        "id": req.params.id,
        title: `Update ${quiz[0].name}`
    });
});
// update quiz
router.post('/:id/update',
    body('name').isLength({ min: 1, max: 255 }),
    body('description').isLength({ min: 1, max: 255 }),
    body('question').isLength({ min: 1, max: 255 }),
    body('answer').isLength({ min: 1, max: 255 }),
    async function (req, res) {
        if (!validationResult(req).isEmpty()) {
            return res.render('update_quiz.njk', {
                ...req.session.user,
                error: "name or description was to long (max 255 characters)",
                ...req.body,
                title: `Update ${req.body.name}`
            });
        }
        if (req.session.name === undefined) {
            return res.redirect('/login');
        }

        const [quiz] = await pool.promise().query(`
    UPDATE
        fabian_flashcard_quiz
    SET
        name = '${req.body.name}',
        description = '${req.body.description}'
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
                front = '${req.body.question[i]}',
                back = '${req.body.answer[i]}'
            WHERE
                id = ${questions[i].id};`
                );
            }
        } else if (req.body.question.length > questions.length) {
            for (let i = 0; i < req.body.question.length; i++) {
                if (i < questions.length) {
                    const [question] = await pool.promise().query(`
                UPDATE
                    fabian_flashcard_question
                SET
                    front = '${req.body.question[i]}',
                    back = '${req.body.answer[i]}'
                WHERE
                    id = ${questions[i].id};`
                    );
                } else {
                    const [question] = await pool.promise().query(`
                INSERT INTO
                    fabian_flashcard_question (quiz_id, front, back)
                VALUES
                    ( ${req.params.id}, '${req.body.question[i]}', '${req.body.answer[i]}');`
                    );
                }
            }
        } else {
            for (let i = 0; i < questions.length; i++) {
                if (i < req.body.question.length) {
                    const [question] = await pool.promise().query(`
                UPDATE
                    fabian_flashcard_question
                SET
                    front = '${req.body.question[i]}',
                    back = '${req.body.answer[i]}'
                WHERE
                    id = ${questions[i].id};`
                    );
                } else {
                    const [question] = await pool.promise().query(`
                DELETE FROM
                    fabian_flashcard_question
                WHERE
                    id = ${questions[i].id};`
                    );
                }
            }
        }

        res.redirect(`/quiz/${req.params.id}`);
    });

module.exports = router