//Dependencies to create server
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json())
//passport configuration, could have more /auth/facebook
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session')

//Multer to upload Pictures
var multer = require('multer');

var upload = multer({ dest: 'uploads/' })
var fs = require('fs');

//Require mongoose for database
var mongoose = require('mongoose');
var { User, House, Work, Picture } =  require('./Users.js');

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true})
mongoose.connection.on('error', function(error){
  console.log(error)
})
mongoose.connection.on('connected', function() {
  console.log('connected to mongoose')
})

//Cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(session({
  secret:'cat',
  cookie:{
    maxAge: 60*60*1000
  }
}))


//THIS IS ONLY SETTING UP PASSPORT
passport.serializeUser((user, done) => {
  // the 1st param passed to done is always the error object.
  // the id in the 2nd param is not the profile.id
  // this id is the id being assigned by mongo
  // the reason we do this instead of profile id is because
  // when we use other strategies like Twitter or Facebook
  // we can't assume that they will have a google id
  // so we use the one assigned by mongo

  // this sets the user.id as the cookie
  done(null, user.id);
});

// takes the id that we stuffed in the cookie from serialize and turn it back into a user model
passport.deserializeUser( async (id, done) => {
  const user = await User.findById( id );
  done(null, user);
});

passport.use(new LocalStrategy(
  function(username, password, done) {
  // Find the user with the given username
    User.findOne({ username: username }, function (err, user) {
      // if there's an error, finish trying to authenticate (auth failed)
      if (err) {
        console.log(err);
        return done(err);
      }
      // if no user present, auth failed
      if (!user) {
        console.log(user);
        console.log('@@LocalStrategy, no user')
        return done(null, false, { message: 'Incorrect username.' });
      }
      // if passwords do not match, auth failed
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      // auth has has succeeded
      return done(null, user);
    });
  }
));
// app.use(express.session({ secret: 'cat' }));
app.use(passport.initialize());
app.use(passport.session());

var auth = require('./routes/auth')
app.use('/', auth(passport));


//When User wants to update house information
app.post('/myHouse', function(req, res) {
  //Create new House

  var house = new House({monthlyRent: req.body.monthlyRent, sqft: req.body.sqft,
    latitude: req.body.latitude, longitude: req.body.longitude})
  .save()
  .then(house => {
    //Find User by ID and add a House feature to the User
    User.findByIdAndUpdate(req.body.userId, {$push:{house: house}}, {new: true}, (err, user) => {
      if (err){
        res.status(500).end(err.message)
      }
      if (user){
        res.json({ user: user, success: true })
      } else {
        res.json({success: true})
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

//Uploading pictures
app.post('/upload',  upload.array('photos[]', 6), function(req, res){
  var houseId = req.houseId

  var saved = req.files.map(item => {
    var picture = new Picture();
     var bitMap = fs.readFileSync(item.path)
     var data = new Buffer(bitMap)//.toString('base64');
     picture.img.data = data;
     picture.img.contentType = item.mimetype;
     return picture.save();
  })

  Promise.all(saved).then( () => {
    res.send({success: true})
  }).catch(error => console.error(error))
})

//Rendering pictures for each individual house
app.get('/switchInfo', function(req, res){
  //Find house by houseId4
  House.findById(req.query.houseId)
  .populate('images')
  .exec((err, result) => {
    if (err) {
      res.json({success: false})
    }
    else {
      var pictures = [];
      result.images.map(pic => {
        pictures = pictures.concat([pic.img.data.toString('base64')]);
      })
      res.json({success: true, pictures: pictures, house: result})
    }
  })
})


//Retrieving pictures
app.get('/photos', function(req, res){
  Picture.find({/*all*/}, (err, pic) => {
    if (err){
      res.json({success: false})
    }

    var pictures = [];
    pic.map(pic => {
      pictures = pictures.concat([pic.img.data.toString('base64')]);
    })
    res.json({success: true, pictures: pictures})
  })
})

app.get('/houses', function(req, res){
  House.find({/*all*/}, (err, h) => {
    if (err){
      res.json({success: false})
    }

    var houses = [];
    h.map(house => {
      houses = houses.concat([house]);
    })
    res.json({success: true, houses: houses})
  })
})

app.listen(process.env.PORT || 1337);
console.log('listening on port 1337')
