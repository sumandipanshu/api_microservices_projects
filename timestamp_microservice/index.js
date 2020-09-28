var express = require("express");
var app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/timestamp/:date_string?", function (req, res) {
  var date_string = req.params.date_string;
  if (!isNaN(date_string)) {
    date_string = parseInt(date_string);
  }
  var date = new Date(date_string);
  if (date_string == undefined) date = new Date();
  if (date != "Invalid Date") {
    res.json({ unix: date.getTime(), utc: date.toUTCString() });
  } else {
    res.json({ error: "Invalid Date" });
  }
});

var listener = app.listen(8000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
