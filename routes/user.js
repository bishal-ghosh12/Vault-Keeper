const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../util/database');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

router.get('/pms/signUp', (req, res) => {
    res.render('sign-up', { message: "" });
});

router.post('/pms/signUpPost', (req, res) => {
    const saltRounds = 10;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) res.redirect('/pms/sighUp');
        db.execute('SELECT id, email, password FROM users WHERE email = ?', [email])
            .then(result => {
                const rs = result[0]; 
                if (rs.length > 0) res.render('sign-up', { message: "User already Registered" })
                else {
                    db.execute('INSERT INTO users(email, password) values (?, ?)',
                    [email, hash])
                        .then(() => {
                            console.log('Insert Successful');
                            res.redirect('/pms/login');
                        })
                        .catch(err => {
                            console.log('Insertion into database failed!!');
                        });
                }
            })
            .catch(err => console.log("Fetching details from users failed"));
    })
})

router.get('/pms/login', (req, res) => {
    res.render('login', { message: "" });
});
const maxAge = 1000 * 60 * 10;
router.post('/pms/loginPost', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    db.execute('SELECT id, email, password FROM users WHERE email = ?', [email])
    .then(result => { 
        const rs = result[0];
        if (rs.length == 0) res.render('login', { message: "Email or Password doesn't match" });
        else {
            bcrypt.compare(password, rs[0].password, (err, result) => {
                if (result === true) {
                    const id = rs[0].id;
                    db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
                        .then(d => {
                            const data = d[0];
                            // console.log(data.length);
                            // console.log(data);
                            if (data.length > 0) {
                                const twofacheck = data[0].twofa;
                                if (twofacheck === 'checked') {
                                    const token = jwt.sign({ email, id, twofa : false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: maxAge });
                                    res.cookie('jwt', token, {maxAge: maxAge, httpOnly: true });
                                    res.redirect('/pms/twofa');
                                }
                                else {
                                    const token = jwt.sign({ email, id, twofa : false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: maxAge });
                                    res.cookie('jwt', token, {maxAge: maxAge, httpOnly: true });
                                    res.redirect('/pms/viewall');
                                }
                            }
                            else {
                                const token = jwt.sign({ email, id, twofa : false }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: maxAge });
                                res.cookie('jwt', token, {maxAge: maxAge, httpOnly: true });
                                res.redirect('/pms/viewall');
                            }
                        })
                        .catch(err => console.log(err));

                }
                else res.render('login', { message: "Email or Password doesn't match" });
            })
        }
    })
    .catch(err => console.log("Fetching details from users failed"));
});
 
router.get('/pms/logout', authenticateToken, (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/pms/login');
});

function authenticateToken(req, res, next) {
    const token = req.cookies.jwt;
    if (token) {
        const token = req.cookies.jwt;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            const id = payload.id;
            db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
                .then(d => { 
                    const data = d[0];
                    if (data.length > 0) {
                        if (data[0].twofa === 'checked') {
                            if (payload.twofa === true) next();
                            else res.redirect('/pms/login');
                        }
                        else {
                            next();
                        }
                    }
                    else {
                        next();
                    }
                })
                .catch(err => console.log(err));
        });
    }
    else {
        res.redirect('/pms/login');
    }
}

module.exports = router;