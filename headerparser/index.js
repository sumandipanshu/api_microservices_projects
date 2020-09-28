var express = require("express");
var app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/whoami", function (req, res) {
  var headers = req.headers;
  var ip = headers["x-forwarded-for"];
  var lang = headers["accept-language"];
  var software = headers["user-agent"];
  res.json({ ipaddress: ip, language: lang, software: software });
});

var listener = app.listen(8000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
