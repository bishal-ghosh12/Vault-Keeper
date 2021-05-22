const express = require('express');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const db = require('../util/database');
const router = express.Router();

router.get('/pms/twofa', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        res.render('token');
    });
});

router.post('/pms/verifytoken', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        const email = payload.email;
        console.log(id);
        db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
            .then(d => { 
                const data = d[0];
                const secretKey = data[0].twofaSecretKey;
                const twofatoken = req.body.token;
                const tokenValidate = speakeasy.totp.verify({
                    secret: secretKey,
                    encoding: 'base32',
                    token: twofatoken,
                    window: 1
                  });
                console.log(tokenValidate);
                const maxAge = 1000 * 60 * 5;
                if (tokenValidate) {
                    
                    const token = jwt.sign({ email, id, twofa : true }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: maxAge });
                    res.cookie('jwt', token, {maxAge: maxAge, httpOnly: true });
                    res.redirect('/pms/viewall');
                }
                else res.render('token', { message: "Invalid Token" });
            })
            .catch(err => console.log(err));
    });
})


function authenticateToken(req, res, next) {
    const token = req.cookies.jwt;
    if (token) {
        next();
    }
    else {
        res.redirect('/pms/login');
    }
}


module.exports = router;