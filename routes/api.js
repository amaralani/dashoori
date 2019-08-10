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

router.get('/initialize-db', (req, res, next) => {
    let hash = require('crypto').createHash('md5').update(req.param('secret')).digest("hex");
    if (hash === '242280a692308ccbc5a30b74610dc0ed') {
        db.query("create table IF NOT EXISTS toilets (latitude double, longitude double, name varchar(255));", (err, result) => {
            if (err) throw err;
        });
        db.query("CREATE INDEX index_latitude ON toilets (latitude);", (err, result) => {
            if (err) throw err;
        });
        db.query("CREATE INDEX index_longitude ON toilets (longitude);", (err, result) => {
            if (err) throw err;
        });
        res.send("Done");
    } else {
        res.status(403).send();
    }
});

router.get('/toilets', function (req, res, next) {
    let latitude = req.param('latitude');
    let longitude = req.param('longitude');
    let list = [];

    db.query("SELECT * FROM( SELECT *,(((acos(sin((?*pi()/180)) * sin((Latitude*pi()/180))+cos((?*pi()/180)) * cos((Latitude*pi()/180)) * cos(((? - Longitude)*pi()/180))))*180/pi())*60*1.1515*1.609344) as distance FROM toilets) t WHERE distance <= 1.5", [latitude, latitude, longitude], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            Object.keys(result).forEach(function (key) {
                let row = result[key];
                list.push({lat: row.latitude, long: row.longitude, "name": row.name})
            });
        }
        res.send({toilets: list});
    });
});

router.post('/toilets', function (req, res, next) {
    insertIntoDB(req.param('latitude'), req.param('longitude'), req.param('name'));
    res.send();
});

router.get("/readFromFile", (req, res, next) => {
    new Promise((resolve, reject) => {
        fs.readFile("clean.json", "utf-8", ((err, data) => {
            let jsonData = JSON.parse(data);
            for (let i = 0; i < jsonData.length; i++) {
                if (jsonData[i].lat && jsonData[i].long) {
                    insertIntoDB(jsonData[i].lat, jsonData[i].long, jsonData[i].name);
                }
            }
            resolve();
        }));
    }).then(() => res.send());
});

const insertIntoDB = (lat, long, name) => {
    db.query("insert into toilets values (? , ? , ?) ",
        [lat, long, name],
        (err, result) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Number of rows affected : " + result.affectedRows);
                console.log("Number of records affected with warning : " + result.warningCount);
                console.log("Message from MySQL Server : " + result.message);
            }
        });
};

module.exports = router;
