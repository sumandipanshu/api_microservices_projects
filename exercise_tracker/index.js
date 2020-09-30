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

app.get("/api/exercise/users", function (req, res) {
  Users.find()
    .select({ username: 1 })
    .exec(function (err, users) {
      if (err) res.send(err.message);
      else
        res.json(
          users.map((user) => {
            return (({ _id, username }) => ({ _id, username }))(user);
          })
        );
    });
});

app.post(
  "/api/exercise/add",
  function (req, res, next) {
    var id = req.body.userId;
    var desc = req.body.description;
    var dur = req.body.duration;
    var date = req.body.date;
    if (!date) {
      date = new Date();
    } else {
      date = new Date(date);
    }

    Users.findById(id, function (err, user) {
      if (err) res.send(err.message);
      else {
        if (user) {
          try {
            var exercise = Exercise({
              description: desc,
              duration: dur,
              date: date,
            });
            exercise.validate(function (err) {
              if (err) {
                res.send(err.message);
              } else {
                user.log.push({
                  description: exercise.description,
                  duration: exercise.duration,
                  date: exercise.date,
                });
                user.count = user.log.length;
                user.save(function (err) {
                  if (err) res.send(err.message);
                  next();
                });
              }
            });
          } catch (e) {
            res.send(e.message);
          }
        } else {
          res.send("Unknown User Id");
        }
      }
    });
  },
  function (req, res) {
    var id = req.body.userId;
    Users.findById(id, function (err, user) {
      if (err) {
        throw err;
      }
      res.json({
        _id: user._id,
        username: user.username,
        duration: user.log[user.count - 1].duration,
        description: user.log[user.count - 1].description,
        date: user.log[user.count - 1].date,
      });
    });
  }
);

app.get(
  "/api/exercise/log",
  function (req, res, next) {
    if (!req.query) {
      res.send("not found");
    } else {
      if (!req.query.userId) {
        res.send("Unknown User Id");
      } else {
        var a = req.query.from,
          b = req.query.to;
        var limit = req.query.limit;
        if (a && isValidDate(a)) {
          res.send("`Invalid Date` in parameter `from`");
        }
        if (b && isValidDate(b)) {
          res.send("`Invalid Date` in parameter `to`");
        }
        if (limit && isNaN(limit)) {
          res.send("Parameter `limit` requires a Number input");
        }
        next();
      }
    }
  },
  function (req, res) {
    var userId = req.query.userId;

    Users.findById(userId, function (err, user) {
      if (err) res.send(err.message);
      else if (user == null) res.send("User not found");
      else {
        let results = user.log;

        let fromDate = new Date(req.query.from);
        let toDate = new Date(req.query.to);
        let limit = Number(req.query.limit);

        //check if to is defined
        if (isValidDate(toDate)) {
          results = results.filter(
            (item) =>
              new Date(item.date) >= fromDate && new Date(item.date) <= toDate
          );
          //check if just from defined
        } else if (isValidDate(fromDate)) {
          results = results.filter((item) => new Date(item.date) >= fromDate);
        }
        //apply limit if defined and applicable
        if (!isNaN(limit) && results.length > limit) {
          results = results.slice(0, limit);
        }
        res.json({
          _id: user._id,
          username: user.username,
          count: results.length,
          log: results.map((log) => {
            return (({ description, duration, date }) => ({
              description,
              duration,
              date,
            }))(log);
          }),
        });
      }
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
