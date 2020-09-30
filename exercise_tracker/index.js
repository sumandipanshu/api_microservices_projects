const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const { Schema } = mongoose;
var Exercise = mongoose.model(
  "Exercise",
  new Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    date: Date,
  })
);

var Users = mongoose.model(
  "Users",
  new Schema(
    {
      username: String,
      count: Number,
      log: [
        new Schema(
          {
            description: String,
            duration: Number,
            date: { type: Date, get: getDate },
          },
          {
            toObject: { getters: true },
            toJSON: { getters: true },
          }
        ),
      ],
    },
    {
      toObject: { getters: true },
      toJSON: { getters: true },
    }
  )
);

function getDate(date) {
  return date.toDateString();
}

app.post(
  "/api/exercise/new-user",
  function (req, res, next) {
    var username = req.body.username.trim();
    if (!username) {
      res.send("Path `username` is required.");
    } else {
      Users.findOne({ username: username }, function (err, data) {
        if (!data) {
          var user = Users({ username: username });
          user.save(function (err) {
            if (err) res.send(err);
            next();
          });
        } else {
          res.send("Username already taken");
        }
      });
    }
  },
  function (req, res) {
    Users.findOne({ username: req.body.username }, function (err, data) {
      res.json({ _id: data._id, username: data.username });
    });
  }
);

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
