const express = require('express');

const router = express.Router();

router.get('/pms', (req, res) => {
    res.render('index');
});

module.exports = router;