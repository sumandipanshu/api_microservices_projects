"use strict";

var express = require("express");
var multer = require("multer");
var upload = multer({ dest: "uploads/" });
var app = express();

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/hello", function (req, res) {
  res.json({ greetings: "Hello, API" });
});

app.post("/api/fileanalyse", upload.single("upfile"), function (req, res) {
  try {
    res.json({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    res.send("No file selected.");
  }
});

var listener = app.listen(8000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
