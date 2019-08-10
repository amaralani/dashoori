const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const fs = require('fs');
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.log(err);
    }
});

/* GET about page. */
router.get('/', function (req, res, next) {
    res.render('report', {});
});

router.post('/location', function (req, res, next) {
    // todo : get location from request and set location in db
    console.log(req.body.lat);
    console.log(req.body.long);
    console.log(req.body.link);
    console.log(req.body.name);
    db.query("create table IF NOT EXISTS toilets_review (latitude double, longitude double, link varchar(255) ,name varchar(255));", (err, result) => {
        if (err) throw err;
    });
    db.query("insert into toilets_review values (? , ? , ?, ?) ",
        [req.body.lat, req.body.long, req.body.link, req.body.name],
        (err, result) => {
            if (err) {
                console.log(err);
                res.render('report', {newLocationSuccess: false});
            } else {
                console.log("Number of rows affected : " + result.affectedRows);
                console.log("Number of records affected with warning : " + result.warningCount);
                console.log("Message from MySQL Server : " + result.message);
                res.render('report', {newLocationSuccess: true});
            }
        });
});

router.get('/feedback', function (req, res, next) {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    db.query("create table IF NOT EXISTS feedback (name varchar(255), handle varchar(255), text text ,ip varchar(255));", (err, result) => {
        if (err) throw err;
    });
    db.query("insert into feedback values (? , ? , ?) ",
        [req.body.name, req.body.handle, req.body.text, ip],
        (err, result) => {
            if (err) {
                console.log(err);
                res.render('report', {feedbackSuccess: false});
            } else {
                res.render('report', {feedbackSuccess: true});
            }
        });
});

module.exports = router;
