var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('databases/words.sqlite');
db.run("PRAGMA case_sensitive_lie = true");

var Twitter = require('twitter');
var twitParams = {
    screen_name: 'jimbolucchesi84'
}

var twitClient = new Twitter({
    consumer_key: 'gIuwHj1mgEVOBr307jNxCIWJN',
    consumer_secret: 'fYpKlE4QR4fM1wT7pu1efkMRuBfZGcGKQgYaEmc59S5i6pMmSi',
    access_token_key: '4753962852-D6rFhsiceo41epNZptnMC31t6cOscOAl2zXjx01',
    access_token_secret: 'j1uVRJhvER6CJqTlr32moNoYx9LBZAQQJX45NBU9FIPy1'
})

router.get('/', function (req, res, next) {
    var count = 0;
    db.get("SELECT COUNT(*) AS tot FROM words", function (err, row) {
        var respText = "Words API: " + row.tot + " words online.";
        res.send(respText);
    });
});

router.get('/count/:abbrev', function (req, res, next) {
    var abbrev = req.params.abbrev;
    /* var data = {};
     var sql = "SELECT COUNT(*) AS wordcount FROM words WHERE word LIKE '" + abbrev + "%'"
     db.get(sql, function(err,row){
         data.abbrev = abbrev;
         data.count = row.wordcount;
         res.send(data);
     });*/

    var alen = abbrev.length;
    var dataArray = [];
    var sql = "SELECT substr(word,1," + alen + "+1) AS abbr, " + "     count(*) AS wordcount " + "     FROM words " + "     WHERE word LIKE '" + abbrev + "%'" + "     GROUP BY substr(word,1," + alen + "+1)";
    db.all(sql, function (err, rows) {
        for (var i = 0; i < rows.length; i++) {
            dataArray[i] = {
                abbrev: rows[i].abbr,
                count: rows[i].wordcount
            }
        }
        res.send(dataArray);
    });
});


router.get("/search/:abbrev", function (req, res, next) {
    var abbrev = req.params.abbrev;
    var query = "SELECT id, word FROM words" + " WHERE word LIKE '" + abbrev + "%' ORDER BY word"
    db.all(query, function (err, data) {
        if (err) {
            res.status(500).send("Database Error")
        } else {
            res.status(200).json(data)
        }
    })
});

router.get("/dictionary/:wordId", function (req, res, next) {
    wordId = req.params.wordId
    var query = "SELECT id, word FROM words WHERE id = " + wordId
    db.all(query, function (err, data) {
        if (err) {
            res.status(500).send("Database Error")
        } else {
            if (data.length > 0) {
                res.wordData = data;
                //res.status(200).json(data)///for twitter replace with next();
                next();
            } else {
                res.status(404).send("Word Id not found: " + wordId)
            }
        }
    })
});

var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.post("/dictionary", function (req, res, next) {
    console.log(req.body);
    var word = req.body.word;
    var sql = "INSERT INTO words (word) VALUES ('" + word + "')"
    db.run(sql, function (err) {
        if (err) {
            console.log(err)
            res.status(500).send("Database Error")
        } else {
            /*console.log(this.lastID)
            res.status(201).json(word + " added. id is " + this.lastID)*/
            
            console.log(result)
            var result = {}
            result.id = this.lastID;
            result.word = word;
            res.set("Location", req.baseURL + "/dictionary/" + result.id)
            res.status(201).json(result)
        }
    });
});

router.put("/dictionary/:wordId", function (req, res, next) {
    console.log(req.body);
    var word = req.body.word;
    var id = req.params.wordId;
    var sql = "UPDATE words SET word = '" + word + "' WHERE id = " + id;
    console.log(sql)
    db.run(sql, function (err) {
        if (err) {
            console.log(err)
            res.status(500).send("Database Error" + err)
        } else {
            if(this.changes == 1){
                res.status(200).send("Word updated.")
            }
            else{
                res.status(404).send("Word not found.")
            }
        }
    })
});



router.delete("/dictionary/:wordId", function (req, res, next) {
    wordId = req.params.wordId
    var query = "DELETE FROM words WHERE id = ?"
    console.log(query)
    db.run(query, [wordId], function (err) {
        console.log("Running query....")
        if (err) {
            console.log(err)
            res.status(500).send("Database Error")
        } else {
            if (this.changes > 0) {
                res.status(204).send()
            } else {
                res.status(404).send("Word Id not found: " + wordId)
            }
        }
    })
});

router.post("/dictionary/:wordId/definition", function (req, res, next) {
    console.log(req.body);
    var wordId = req.params.wordId;
    var definition = req.body.definition;
    var sql = "INSERT INTO definition (wordid,defid,definition) "
           + " VALUES ( ?, IFNULL(( SELECT MAX(defid)+1 FROM definition WHERE wordid = ? ), 1), ? )"
   db.run(sql, [wordId, wordId, definition], function (err) {
        if (err) {
            console.log(err)
            res.status(500).send("Database Error" + err)
        } else {
            db.get("SELECT defid FROM definition WHERE rowid = " +this.lastID, function(err, row){
                newDefId = row.defid;
                res.set("Location", req.baseURL + "/dictionary/" + wordId + "/definition/" + newDefId)
                res.status(201).json("Definition Added")
            })
            
        }
    
    })
});

router.get("/dictionary/:wordId/definition", function (req, res, next) {
    wordId = req.params.wordId
    var query = "SELECT wordid, defid, definition FROM definition WHERE wordid = ?"
    db.all(query, [wordId], function (err, data) {
        if (err) {
            console.log(err)
            res.status(500).send("Database Error")
        } else {
            if (data.length > 0) {
                res.status(200).json(data)
            } else {
                res.status(404).send("Word Id not found: " + wordId)
            }
        }
    })
});

router.delete("/dictionary/:wordId/definition/:defId", function (req, res, next) {
    wordId = req.params.wordId
    defId = req.params.defId
    var query = "DELETE FROM definition WHERE wordid = ? and defid = ?"
    db.run(query,[wordId, defId], function (err) {
        if (err) {
            res.status(500).send("Database Error")
        } else {
            if (this.changes > 0) {
                res.status(204).send()
            } else {
                res.status(404).send("Definition not found: " + wordId + ", " + defId)
            }
        }
    })
});

router.put("/dictionary/:wordId/definition/:defId", function (req, res, next) {
    console.log(req.body);
    var definition = req.body.definition
    var wordId = req.params.wordId
    var defId = req.params.defId
    var sql = "UPDATE definition SET definition = ? WHERE wordid = ? AND defid = ?"
    console.log(sql)
    db.run(sql, [definition, wordId, defId], function (err) {
        if (err) {
            console.log(err)
            res.status(500).send("Database Error" + err)
        } 
        
        else {
            if(this.changes == 1){
                res.status(200).send("Definition updated.")
            }
            else{
                res.status(404).send("Definition not found.")
            }
        }
    })
});

router.get("/dictionary/:wordId", function (req, res, next) {
    var word = res.wordData[0].word
    res.wordData[0].twitter = {}
    var twitSearch = "https://api.twitter.com/1.1/search/tweets.json?"
    twitSearch += "q="
    twitSearch +="lang%3Aen%20"
    twitSearch += "q=%23" + word
    twitSearch +="&result_type=recent"
    twitClient.get(twitSearch, twitParams, function(error, tweets, response){
        if (error){
            console.error("Twitter fail:")
            console.error(error)
        }
        else{
            console.error("Twitter twits:");
            console.log(tweets);
            res.wordData[0].twitter.tweets = tweets;
            
        }
        res.status(200).json(res.wordData);
    })
});
    
    


module.exports = router;
