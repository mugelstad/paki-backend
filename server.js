//Dependencies to create server
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json())

//Require mongoose for database
var mongoose = require('mongoose');
var { User, House, Work }=  require('./Users.js');

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true})
mongoose.connection.on('error', function(error){
  console.log(error)
})
mongoose.connection.on('connected', function(){
  console.log('connected to mongoose')
})

//Routes
app.post('/register', function(req, res){
  //Create new User
  new User({username: req.body.username, password: req.body.password})
  .save()
  .then(user => res.json({ user: user, success: true }))
  .catch(error => res.status(500).end(error.message))
  //Direct User to User homepage
});


app.post('/login', function(req, res){
  //Use passport to authenticate user
  var username = req.body.username;
  //Find user by username
  User.findOne({username: username}).exec(function(err, user){
    if (err){
      res.status(500).end(err.message);
    }
    if (user) {
      res.send({success: true})
    } else {
      res.send({sucess: false})
    }
  })
  //Direct User to user homepage
})

//When User wants to update house information
app.post('/myHouse', function(req, res) {
  //Create new House
  var house = new House({monthlyRent: req.body.monthlyRent, sqft: req.body.sqft,
    latitude: req.body.latitude, longitude: req.body.longitude})
  .save()
  .then(house => {
    //Find User by ID and add a House feature to the User
    User.findByIdAndUpdate(req.body._id, {$push:{house: house}}, {new: true}, (err, user) => {
      if (err){
        res.status(500).end(err.message)
      }
      if (user){
        res.json({ user: user, success: true })
      }
    })
  })
  .catch(error => res.status(500).end(error.message))
})


app.post('/myWork', function(req, res){
  //Create new Work
  var work = new Work({latitude: req.body.latitude, longitude: req.body.longitude})
  .save()
  .then(work => {
    console.log(work);
    //Find User by ID and add a Work feature to the User
    User.findByIdAndUpdate(req.body._id, {$push:{work: work}}, {new: true}, (err, user) => {
      if (err){
        res.status(500).end(err.message)
      }
      if (user){
        res.json({ user: user, success: true })
      }
    })
  })
  .catch(error => res.status(500).end(error.message))
})

app.listen(process.env.PORT || 1337);
console.log('listening on port 1337')
