"use strict";

var express = require("express");
var mongoose = require("mongoose");
var shortid = require("shortid");
var dns = require("dns");

var app = express();

// Basic Configuration
var port = 8000;

/** this project needs a db !! **/
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const { Schema } = mongoose;
var ShortURL = mongoose.model(
  "ShortURL",
  new Schema({
    original_url: { type: String, unique: true },
    shortid: { type: String, unique: true },
  })
);

app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl/new", function (req, res) {
  var url = req.body.url;
  if (/^https?:\/\//i.test(url) == false) {
    res.json({ error: "invalid URL" });
    return;
  }
  dns.lookup(url.replace(/^https?:\/\//i, ""), function (err) {
    if (err && err.code === "ENOTFOUND") {
      res.json({ error: "invalid URL" });
    } else {
      ShortURL.findOne({ original_url: url }, function (err, doc) {
        if (doc == null) {
          var shortId = shortid.generate();
          var urldoc = new ShortURL({
            original_url: url,
            shortid: shortId,
          });
          urldoc.save(function (err) {
            if (err) res.json({ error: err });
            else res.json({ original_url: url, short_url: shortId });
          });
        } else {
          res.json({ original_url: doc.original_url, short_url: doc.shortid });
        }
      });
    }
  });
});

app.get("/api/shorturl/:shortid", function (req, res) {
  ShortURL.findOne({ shortid: req.params.shortid }, function (err, doc) {
    if (doc == null) {
      res.redirect("https://www.freecodecamp.org");
    } else {
      res.redirect(doc.original_url);
    }
  });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
