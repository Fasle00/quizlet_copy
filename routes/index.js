const express = require('express')
const router = express.Router()

const {body, validationResult} = require('express-validator')

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
body('username').isLength({min: 4, max: 32}), 
body('password').isLength({min: 4, max: 32}),  
async function(req, res){
    const result = validationResult(req);
    if (!result.isEmpty()){
        return res.render('login.njk', {error: 'Username and password must be 4-32 characters long.'})
    }
    try{
        const [user] = await pool.promise().query(`SELECT * FROM alea_lacta_est_user WHERE alea_lacta_est_user.\`name\` = '${req.body.username}'`)
        console.log(user)
        console.log(user[0])
        console.log(user[0].password)

        
        bcrypt.compare(req.body.password, user[0].password, function(err, result) {
            console.log(result)
            if (result){
                req.session.name = req.body.username
                res.redirect(`user/:${req.body.username}`)
            } else {
                res.render('login.njk', {username:req.body.username, error: 'wrong password', ...req.session.user})
            }
        })
     } catch (error){
        console.log(error)
        res.render('login.njk', {error: 'wrong username', ...req.session.user})
    }
})
router.get('/user/:name', async function (req, res) {
    if (req.session.name === undefined){
        return res.redirect('/login')
    }
    let user = {
        username: req.session.name,
        loggedIn: true,
    }
    req.session.user = user
    console.log(req.session.user)
    console.log({username: req.session.name})
    res.render('user.njk', req.session.user)
})

router.get('/user/:name/new', async function (req, res) {
    res.render('create_tweep.njk', req.session.user)
})

router.get('/tweeps', async function (req, res) {
    const [tweeps] = await pool.promise().query('SELECT * FROM alea_leacta_est_tweep JOIN alea_lacta_est_user ON alea_leacta_est_tweep.user_id = alea_lacta_est_user.id')
    res.render('tweeps.njk', {...req.session.user, tweeps})
})

router.get('/users', async function (req, res) {
    try{
    const [users] = await pool.promise().query('SELECT * FROM alea_lacta_est_user')
    res.json(users)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.get('/create/account', async function (req, res) {
    res.render('create_account.njk')
})

router.post('/create/account',
body('email').isLength({min:2}).isEmail(),
body('username').isLength({min:4, max:32}),
body('password').isLength({min:4, max:32}),
body('city').isLength({min:2}),
body('state').isLength({min:4}),
body('zip').isLength({min:4}),
 async function (req, res) {
    if (!validationResult(req).isEmpty())
        return res.render('create_account.njk', {error:"poggers test error"})
    try{
    bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
        await pool.promise().query(`INSERT INTO alea_lacta_est_user (name, password, mail) VALUES
    ('${req.body.username}', '${hash/*brownies*/}', '${req.body.mail}');`)
    })
    res.json(req.body)
} catch (error){
    return res.render('create_account.njk', {error: "Failed to create an account"})
}
})

router.get('/uppdate_user', async function (req, res) {
    res.render('/uppdate_user')
})

router.post('/uppdate_user', async function (req, res){

    res.redirect(`/user/:${req.session.username}`)
})

router.post('/user/:name/delete', async function (req, res){
    res.redirect('/')
})

router.get('/hashtest', async function (req, res){
    
    const myPlaintextPassword = 'test';
    const someOtherPlaintextPassword = 'not_bacon';

    bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
        console.log(hash)
        return res.json(hash)
    })

})

router.get('/tweeps/create', async function(req, res){
    if(req.session.name === undefined) {
        return res.redirect('/login')
    }
    res.render('create_tweep.njk', req.session.user)
})

router.post('/tweeps', 
body('tweep').isLength({min: 1, max: 255}),
async function(req, res){
    if (!validationResult(req).isEmpty()){
        return res.render('create_tweep.njk', {error: "Tweep was to long (max 255 characters)"})
    }
    try{
        const [id] = await pool.promise().query(`SELECT alea_lacta_est_user.id  from alea_lacta_est_user WHERE alea_lacta_est_user.name = '${req.session.name}'`)
        await pool.promise().query(`INSERT INTO alea_leacta_est_tweep (user_id, text) VALUES ('${id[0].id}', '${req.body.tweep}');`) // ${new Date().toISOString().slice(0,19).replace('T', ' ')}
        return res.redirect('/')

    } catch(error){
        res.redirect('/')
    }

})

module.exports = router