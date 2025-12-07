const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const userService = require("./user-service.js");
// server.js / app.js (where express is configured)
const passport = require('passport')
const passportJWT = require('passport-jwt')
const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt
const jwt = require('jsonwebtoken')
const { checkUser, getFavourites, addFavourite, removeFavourite } = require('./user-service.js') // example


const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());


const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() 

}


opts.jwtFromRequest = (req) => {
  let header = req && req.headers && req.headers.authorization;
  if (!header) return null;
  // accept either "Bearer <token>" or "JWT <token>"
  const parts = header.split(' ');
  if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'JWT')) {
    return parts[1];
  }
  return null;
};

opts.secretOrKey = process.env.JWT_SECRET;

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  // jwt_payload should contain at least _id and userName (we'll set those when signing)
  // Look up the user by id to attach to req.user
  userService.findUserById(jwt_payload._id)
    .then(user => {
      if (user) return done(null, user);
      return done(null, false);
    }).catch(err => done(err, false));
}));

//passport initialization
app.use(passport.initialize())


app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});


app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        // create payload with _id and userName
        const payload = { _id: user._id, userName: user.userName };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ "message": "login successful", token: token });
    }).catch(msg => {
        res.status(422).json({ "message": msg });
    });
});


app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});


app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});


app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});