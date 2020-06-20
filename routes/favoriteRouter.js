const express = require("express");
const bodyParser = require("body-parser");
const Favorite = require("../models/favorite");
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route("/")
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
  //retrieve list of favorites for that user
    Favorite.findOne({user: req.user._id})
    //populate user and campsite refs before returning favs
    .populate("user")
    .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  //if there is no favorite document for the user
  //create a fav doc for the user
  //add the campsite IDs from the req body to the campsites array for the doc
  Favorite.findOne({user: req.user._id})
  .then((favorite) => {
    if(favorite) {
      req.body.forEach(fav => {
        if(!favorite.campsites.includes(fav._id)) {
          favorite.campsites.push(fav._id);
        }
      });
      favorite.save()
      .then(favorite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
    .catch(err => next(err));
    } else {
      Favorite.create({user: req.user._id, campsites: req.body})
      .then((favorite) => {
        console.log("Favorite Created ", favorite);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      })
      .catch((err) => next(err));
      }
    }).catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then((favorite) => {
      if(favorite) {
        favorite.remove()
        .then(favorite => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        })
        .catch(err => next(err));
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      }
    })
    .catch((err) => next(err));
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
  //find the favorite document for this particular user
  Favorite.findOne({user: req.user._id})
  //look inside the favorite document
  .then((favorite) => {
    if (favorite) {
      if (!favorite.campsites.includes(req.params.campsiteId)) {
        favorite.campsites.push(req.params.campsiteId);
        favorite.save()
        .then(favorite => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        })
        .catch(err => next(err));
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('That campsite is already a favorite!');
      }
    } else {
      Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId]})
      .then(favorite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      })
      .catch(err => next(err));
    }
  })
  .catch(err => next (err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorite.findOne({user: req.user._id})
    .then((favorite) => {
      if(favorite) {
        const index = favorite.campsites.indexOf(req.params.campsiteId);
        if (index >=0) {
          favorite.campsites.splice(index, 1);
        }
        favorite.save()
        .then(favorite => {
          Favorite.findById(favorite._id)
          .then(favorite => {
            console.log('Favorite Campsite Deleted!', favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
        }).catch(err => next(err));
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorite);
      }
    }).catch((err) => next(err));
});

module.exports = favoriteRouter;