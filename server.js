require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const session = require('express-session');

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const quizRouter = require('./routes/quiz');

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());

nunjucks.configure('views', {
	autoescape: true,
	express: app,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(
session({
	secret: "väldigttrevligt",
	resave: false,
	saveUninitialized: true,
	cookie: {sameSite: true},
	})
);

app.use((req, res, next) => {
	res.locals.url = req.originalUrl;
	next();
});

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/quiz', quizRouter);

app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`)
});
