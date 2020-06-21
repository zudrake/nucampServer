const express = require('express');
const bodyParser = require('body-parser');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');
const favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find()
            .populate('user', 'campsites')
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        console.log(req.user._id);
        Favorite.findOne({ 'user': req.user._id })
            .then(favorite => {
                console.log('favorite' + favorite);
                if (favorite) {
                    const campsitestobesaved = [];
                    const campsitesalreadyexisting = [];
                    req.body.forEach(campsite => {
                        console.log("campsite" + campsite._id);
                        console.log(favorite.campsites);
                        if (!favorite.campsites.includes(campsite._id)) {
                            campsitestobesaved.push(campsite._id);
                        }
                        else
                            campsitesalreadyexisting.push(campsite._id);
                    });
                    if (campsitestobesaved.length > 0) {
                        console.log(`Favorite with Campsites Ids ${campsitesalreadyexisting} were not considering for saving since they are already exsiting`);
                        favorite.campsites.push(campsitestobesaved);
                        favorite.save()
                            .then(outputfavorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(outputfavorite);
                            })
                            .catch(err => {
                                err = new Error(`Favorite with Campsites Ids ${campsitesalreadyexisting} have some problem in saving`);
                                err.status = 404;
                                return next(err);
                            });
                    } else {
                        err = new Error(`Favorite with Campsites Ids ${campsitesalreadyexisting} were not considering for saving since they are already exsiting`);
                        err.status = 404;
                        return next(err);
                    }
                }
                else {
                    Favorite.create({ user: req.user._id, campsites: req.body })
                        .then(favorite => {
                            console.log('Campsite Created ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Favorite.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/campsiteId');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Favorite.findOne({ 'campsites': req.params.campsiteId })
            .then(favorite => {
                if (!favorite) {
                    req.body.user = req.user._id;
                    req.body.campsites = req.params.campsiteId;
                    Favorite.create(req.body)
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Campsite ${req.params.campsiteId} already existing `);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    const index = favorite.campsites.indexOf(req.params.campsiteId)
                    favorite.campsites.splice(index, 1)
                    favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json({ status: 'Favorites have been deleted!' });
                        })
                        .catch(err => next(err));

                }
            })
    });
module.exports = favoriteRouter;
