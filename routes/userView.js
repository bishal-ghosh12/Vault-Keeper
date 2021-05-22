const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../util/database');
const router = express.Router();

router.get('/pms/viewall', authenticateToken, (req, res) => {
    const token = req.cookies.jwt; 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        }
        else {
            res.render('userView');
        }
    });
});

router.get('/pms/secret', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        } 
        else {
            const id = decodedData.id;
            db.execute('SELECT * FROM secret WHERE user_id = ?', [id])
                .then(result => {  
                    const rs = result[0];
                    res.render('secret', {secrets: rs});                    
                })
                .catch(err => console.log("Fetching details from users failed"));
        }
    });
});

router.post('/pms/secretPost', authenticateToken ,(req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        }
        else {
            const id = decodedData.id;
            const title = req.body.title;
            const login = req.body.login;
            const password = req.body.password;
            const websiteAddress = req.body.websiteAddress;
            const today = new Date();
            const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            const dateTime = date + ' ' + time;
            db.execute('INSERT INTO secret(user_id, title, login, password, website_address, last_modified) values (?, ?, ?, ?, ?, ?)',
                    [id, title, login, password, websiteAddress, dateTime])
                        .then(() => {
                            res.redirect('/pms/secret');
                        })
                        .catch(err => {
                            console.log('Insertion into database failed!!');
                        });
        }
    });
});

router.post('/pms/secretUpdate', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        }
        else {
            const secretID = req.body.sid;
            const title = req.body.title;
            const login = req.body.login;
            const password = req.body.password;
            console.log(login);
            console.log(password);
            const websiteAddress = req.body.websiteAddress;
            const today = new Date();
            const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            const dateTime = date + ' ' + time;
            db.execute('UPDATE secret SET title = ?, login = ?, password = ?, website_address = ?, last_modified = ? WHERE s_id = ?', [title, login, password, websiteAddress, dateTime, secretID])
                .then(result => {
                    console.log(result);
                    if (result) {
                        res.redirect('/pms/secret');
                    }
                })
                .catch(err = console.log(err));
        }
    });
});

router.post('/pms/secretDelete', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        }
        else {
            const secretID = req.body.sid;
            db.execute('DELETE FROM secret WHERE s_id = ?', [secretID])
                .then(result => {
                    console.log(result);
                    if (result) {
                        res.redirect('/pms/secret');
                    }
                })
                .catch(err = console.log(err));
        }
    });
})

router.get('/pms/paymentsecret', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedData) => {
        if (err) {
            console.log(err);
            res.redirect('/pms/login');
        }
        else {
            res.render('paymentSecret');
        }
    });
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