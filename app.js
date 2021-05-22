const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const indexRouter = require('./routes/indexPage');
const userRouter = require('./routes/user');
const viewAllRouter = require('./routes/userView');
const settingsRouter = require('./routes/settings');
const tokenRouter = require('./routes/twofa');
const cookieParser = require('cookie-parser');
const db = require('./util/database');

const app = express();

app.use(bodyparser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(indexRouter);
app.use(userRouter);
app.use(viewAllRouter);
app.use(settingsRouter);
app.use(tokenRouter);

app.get('/pms/helloworld', (req, res, next) => {
    res.send('Hello world');
})

app.listen(3000);