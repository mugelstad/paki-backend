var express = require('express');
var router = express.Router();
var {User} = require('../Users');

module.exports = function(passport) {

  // POST registration page
  router.post('/register', function(req, res){
    //Create new User
    new User({username: req.body.username, password: req.body.password})
    .save()
    .then(user => res.json({ user: user, success: true }))
    .catch(error => res.status(500).end(error.message))
    //Direct User to User homepage
    console.log('!@@register, user saved')
  });

  // POST Login page
  router.post('/auth/local', passport.authenticate('local'), function(req, res) {
    console.log('local authenticated');
    console.log('@@auth/local', req.user)
    res.json({'success':true, user: req.user})
  });

  // router.get(
  //   '/auth/google',
  //   // the first  parameter to authenticate tells passport which strategy to use
  //   // the 2nd one is an options object
  //   // the scope specifies to google what access we want to have from this profile
  //   passport.authenticate('google', {
  //     scope: ['profile', 'email']
  //   })
  // );
  // router.get('/auth/facebook', passport.authenticate('facebook'));

  router.get('/api/logout', (req, res) => {
    // this logout method is automatically added by passport
    // this takes the cookie that's associated with the users id
    // and destroys it
    req.logout();
    // sends back undefined
    res.redirect('/');
  });

  // GET Logout page

  return router;
};


//
// const passport = require 'passport';
//
// module.exports = app => {
//   // The route for logging users into google
//   app.get(
//     '/auth/google',
//     // the first  parameter to authenticate tells passport which strategy to use
//     // the 2nd one is an options object
//     // the scope specifies to google what access we want to have from this profile
//     passport.authenticate('google', {
//       scope: ['profile', 'email']
//     })
//   );
//
//   // for this specific route below, make sure you have this route available in the
//   // google developers console otherwise you will get an error when you hit the /auth/google route
//   // the error will give you the link to fix the problem
//   // make sure something like http:localhost:3000/auth/google/callback
//   // is input into the authorized redirect urls
//   app.get('/auth/facebook', passport.authenticate('facebook'));
//
//   app.get('/auth/local',passport.authenticate('local'));
//
//   // This route will be hit automatically when the user hits the /auth/google route
//   // this tells passport that the user is not attempting to be authenticated for the first time
//   // we are turning the actual code into an actual profile
//   app.get(
//     '/auth/google/callback',
//     passport.authenticate('google'),
//     (req, res) => {
//       res.redirect('/')
//     }
//   );
//
//   app.get(
//     '/auth/facebook/callback',
//     passport.authenticate('facebook',
//     { successRedirect: '/', failureRedirect: '/login' }
//   ));
//
//   app.get('/api/logout', (req, res) => {
//     // this logout method is automatically added by passport
//     // this takes the cookie that's associated with the users id
//     // and destroys it
//     req.logout();
//     // sends back undefined
//     res.redirect('/');
//   });
//
//   app.get('/api/current_user', (req, res) => {
//     console.log(req.user);
//     res.send(req.user);
//   });
// };
