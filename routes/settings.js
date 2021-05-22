const express = require('express');
const db = require('../util/database');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

router.get('/pms/settings', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
            .then(d => {
                const data = d[0];
                if (data.length > 0) res.render('settings', { checked: data[0].auto_logout, time: data[0].auto_logout_time, twofactorAuth: data[0].twofa });
                else res.render('settings', { checked: "uncheked", time: "50", twofactorAuth: "uncheked" });
            })
            .catch(err => console.log(err));
    });
});

router.post('/pms/autoLogout', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        const checked = "checked";
        const time = req.body.time;

        db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
            .then(d => {
                const data = d[0];
                if (data.length) {
                    db.execute('UPDATE settings SET auto_logout = ?, auto_logout_time = ? WHERE user_id = ?', [checked, time, id])
                        .then(d => {
                            res.cookie('jwt', token, { maxAge: 1000 * 60 * parseInt(time), httpOnly: true });
                            res.send({ message: "Update Success" });
                        })
                }
                else {
                    db.execute('INSERT INTO settings(user_id, auto_logout, auto_logout_time) values (?, ?, ?)', [id, checked, time])
                        .then(d => {
                            res.cookie('jwt', token, { maxAge: 1000 * 60 * parseInt(time), httpOnly: true });
                            res.send({ message: "Insert Success" });
                        })
                }
            })
    })
});

router.get('/pms/autoLogoutOFF', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        res.cookie('jwt', token, { maxAge: 1000 * 60 * 10, httpOnly: true });
        const id = payload.id;
        db.execute('UPDATE settings SET auto_logout = ? WHERE user_id = ?', ["unchecked", id])
            .then(d => {
                res.send({ message: "Update Success" });
            })
            .catch(err => console.log('Update Failure'));
    });
});

router.get('/pms/2fagenerate', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const secret = generateSecretKey();
        qrcode.toDataURL(secret.otpauthURL, (err, data_url) => {
            res.send({QRCode: data_url, secretKey: secret.base32});
        });
    });
});

router.get('/pms/off2fagenerate', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        const checked = "checked";
        db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
            .then(d => {
                const data = d[0];
                if (data.length) {
                    db.execute('UPDATE settings SET twofa = ?, twofaSecretKey = ? WHERE user_id = ?', ["unchecked", "", id])
                        .then(d => {
                            res.send({ message: "Turned OFF TWOFA" });
                        })
                }
                // else {
                //     db.execute('INSERT INTO settings(user_id, twofa, twofaSecretKey) values (?, ?, ?)', [id, checked, secretKey])
                //         .then(d => {
                //             res.send({ message: "Insert Success" });
                //         })
                // }
            })
            .catch(err => console.log(err));
    })
});

router.post('/pms/activate2fa', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        const checked = "checked";
        const twofatoken = req.body.token
        const secretKey = req.body.secretKey;
        const tokenValidate = speakeasy.totp.verify({
            secret: secretKey,
            encoding: 'base32',
            token: twofatoken,
            window: 1
          });
    
    
        if (tokenValidate) {
            db.execute('SELECT * FROM settings WHERE user_id = ?', [id])
                .then(d => {
                    const data = d[0];
                    if (data.length) {
                        db.execute('UPDATE settings SET twofa = ?, twofaSecretKey = ? WHERE user_id = ?', [checked, secretKey, id])
                            .then(d => {
                                res.send({ message: "Update Success", flag : true });
                            })
                    }
                    else {
                        db.execute('INSERT INTO settings(user_id, twofa, twofaSecretKey) values (?, ?, ?)', [id, checked, secretKey])
                            .then(d => {
                                res.send({ message: "Insert Success", flag : true });
                            })
                    }
                })
                .catch(err => console.log(err));
        }
        else res.send({message: "Token Invalid ...", flag : false });
    })
});

router.get('/pms/getAllSecrets', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        db.execute('SELECT * FROM secret WHERE user_id = ?', [id])
            .then(d => {
                const data = d[0];
                // console.log(data[0].s_id);
                res.send({message : 'Success', data: data});
            })
            .catch(err => console.log(err));
    });
});

function updateAllSecrets(datas) {
    return new Promise((resolve, reject) => {
        const final = [];
        datas.forEach(async(data) => {
            db.execute('UPDATE secret SET login = ?, password = ? WHERE s_id = ?', [data.login, data.password, data.s_id])
            .then(res => {
                final.push(res);
            })
            .catch(err => console.log("Fetching details from users failed"));
        });
        Promise.all(final)
            .then(res => resolve(res));
    });
    // for(let i = 0; i < data.length; ++i) {
    //     return new Promise((resolve, reject) => {
    //         db.execute('UPDATE secret SET login = ?, password = ? WHERE s_id = ?', [data[i].login, data[i].password, data[i].s_id])
    //         .then(res => {
    //             resolve(res);
    //         })
    //         .catch(err => console.log("Fetching details from users failed"));
    //     })
    // };
}

router.post('/pms/storeEncryptedData', authenticateToken, (req, res) => {
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        const password = req.body.password;
        const data = req.body.data;
        const saltRounds = 10;

        bcrypt.hash(password, saltRounds, (err, hash) => {
            db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, id])
                .then(rs => {
                    updateAllSecrets(data) 
                        .then(result => {
                            res.send({flag: 'Success'});
                        })
                        .catch(err => console.log(err));
                })
                .catch(err => console.log("Fetching details from users failed"));
        });
    });
});

router.post('/pms/updateNewPassword', authenticateToken, (req, res) => {
    const saltRounds = 10;
    const password = req.body.password; 
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        const id = payload.id;
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) res.redirect('/pms/settings');
            db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, id])
                .then(d => {
                    res.send({ flag : true });
                })
                .catch(err => console.log(err));
        })
    });
});

function generateSecretKey() {
    const secretKey = speakeasy.generateSecret({
        name: "Password Management System"
    });
    return {
        otpauthURL : secretKey.otpauth_url,
        base32 : secretKey.base32
    };
}

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