var express = require("express");
var app = express();
var mongo = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = process.env.MONGODB_URI;

app.use('/', express.static(__dirname + '/public'));
app.use(function(req,res){
    // create data
    if(req.url.indexOf("/new/") == 0){
        var urlToVerify = req.url.substring(5);
        var reg = /http(s)?:\/\/.?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g ;
        
        
        // check if url is valid, if not, redirect to home page
        if(!urlToVerify.match(reg)){
            res.redirect("/");
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            //check if this url has been shorten before
            mongo.connect(url, function(err, db){
                if(err){throw err}
                console.log("Connected correctly to server");
                var newData = db.collection("url");
                newData.find({
                    "original_url": urlToVerify
                }).toArray(function(err, docs){
                    console.log(docs);
                    if(err){throw err}
                    if(docs.length > 0){ // this url has been shorten, load it from database
                        res.end(JSON.stringify({
                            "original_url": docs[0].original_url,
                            "short_url": "https://imgshortener-fcc.herokuapp.com/"+docs[0]._id
                        }));
                        db.close();
                    } else { // this url hasn't been shorten yet, insert it from database
                        newData.insert({
                            "original_url": urlToVerify
                        }, function(err, record){
                            if(err){throw err}
                            console.log("new url has been shorten");
                            res.end(JSON.stringify({
                                "original_url": urlToVerify,
                                "short_url":"https://imgshortener-fcc.herokuapp.com/"+record.ops[0]._id
                            }));
                            db.close();
                        });
                    }
                });
            });
            
        }
    } else {
        // check if _id in data
        var idToFind = req.url.substring(1);
        mongo.connect(url, function(err, db){
           if(err){throw err}
           console.log("Connected correctly to server, to find url");
           var oldData = db.collection("url");
           oldData.find({
               "_id": ObjectId(idToFind)
           }).toArray(function(err, docs){
              if(err){throw err}
              if(docs.length>0){
                  res.redirect(docs[0].original_url);
                  db.close();
              } else {
                  res.redirect("/");
                  db.close();
              }
           });
        });
        
    }
});
var port = process.env.PORT || 8080;
app.listen(port);