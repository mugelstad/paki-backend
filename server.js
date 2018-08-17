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
var connectMongo = require('connect-mongo')

//Multer to upload Pictures
var multer = require('multer');

var upload = multer({ dest: 'uploads/' })
var fs = require('fs');

//Require mongoose for database
var mongoose = require('mongoose');
var { User, House, Work, Picture, Offer } =  require('./Users.js');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

const MongoStore = connectMongo(session)
app.use(session({
  secret: process.env.SESSION,
  cookie:{
    maxAge: 60*60*1000
  },
  store: new MongoStore({ mongooseConnection: mongoose.connection })
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
    latitude: req.body.latitude, longitude: req.body.longitude, address: req.body.address})
  .save()
  .then(house => {
    //Find User by ID and add a House feature to the User
    User.findByIdAndUpdate(req.user._id, {$push:{house: house}}, {new: true}, (err, user) => {
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
  var work = new Work({
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    address: req.body.address})
  .save()
  .then(work => {
    //Find User by ID and add a Work feature to the User
    User.findByIdAndUpdate(req.user._id, {$push: {work: work} }, {new: true}, (err, user) => {
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

  var saved = req.files.map(item => {
     var picture = new Picture();
     var bitMap = fs.readFileSync(item.path)
     var data = new Buffer(bitMap)
     picture.img.data = data;
     picture.img.contentType = item.mimetype;
     return picture.save();
  })

  Promise.all(saved).then((result) => {
    var imgArr = result.map(img => img._id)
    console.log('@@mappedresult', imgArr)
    House.findByIdAndUpdate(req.user.house,
      { $push: { images: { $each: imgArr }}}, {new: true},
      (err, house) => { console.log('@@foundhouse', house) }
    )
    res.send({success: true})
  }).catch(error => console.error(error))
})

//Rendering pictures for each individual house
app.get('/switchInfo', function(req, res){
  //otherhouse
  var pictures = [];
  var otherhouse;
  var userhouse;
  House.findById(req.query.houseId)
  .populate('images')
  .exec((err, result) => {
    if (err) {
      res.json({success: false})
    }
    else {
      result.images.map(pic => {
        pictures = pictures.concat([pic.img.data.toString('base64')]);
      })
      otherhouse = result;
      House.findById(req.user.house)
      .then(house => {
        userhouse = house
        var response = {
          success: true,
          pictures: pictures,
          otherhouse: otherhouse,
          userhouse: userhouse
        }
        console.log('@@response', response)
        res.json(response)
      })
      .catch(err => console.log(err))
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
    res.json({success: true, houses: h})
  })
})

app.post('/saveInterested', function(req, res){
  //find the user, add in the message, update the user
  User.findByIdAndUpdate(req.user._id,
    {$push: {interested: req.body.otherhouseId}},
    {'new': true}, (err, result) => {
      if (err) {
        console.log(err)
        res.json({success: false, error: err})
      }
      else {
        res.json({success: true})
      }
    }
  )
})

app.post('/removeInterested', function(req, res){
  //find the user, add in the message, update the user
  User.findByIdAndUpdate(req.user._id,
    {$pull: {interested: req.body.otherhouseId}},
    (err, result) => {
    if(err) {
      res.json({success: false, error: err})
    } else {
      res.json({success: true})
    }
  })
})

app.get('/saved', function(req, res) {
  var houses;
  User.findById(req.user._id)
  .populate('interested')
  .exec((err, result) => {
    if (err) {
      res.json({success: false, error: err})
    } else {
      res.json({success: true, houses: result.interested})
    }
  })
})

app.post('/sendOffer', function(req, res) {
  var receiverId;
  User.findOne({house: [req.body.otherhouseId]})
  .then(otheruser => {
    receiverId = otheruser._id;
    new Offer({
      amount: parseFloat(req.body.amount),
      sender: req.user._id,
      receiver: otheruser._id
    })
    .save((err, offer) => {
      var criteria = {_id: { $in: [req.user._id, receiverId]}}
      User.update(criteria,
        {$push: {offers: offer._id}},
        {'new': true, 'multi': true},
        (err, result) => {
          if (err) { res.json({ success: false })}
          else { res.json({ success: true })}
        }
      )
    })
  });
})

app.get('/offers', function(req, res) {
  User.findById(req.user._id)
  .populate('offers')
  .exec((err, result) => {
    if (err){ console.log(err) }
    else {
      let otherUserArr = [];
      // find all the different users
      let offerArr = result.offers.slice()
      let userId = req.user._id.toString()

      offerArr.forEach(offer => {
        // if user is the sender
        (offer.sender.toString() === userId) ?
          otherUserArr.push(offer.receiver) :
          otherUserArr.push(offer.sender)
      })

      //Find all users who have interracted with logged-in user
      var criteria = {_id: { $in: otherUserArr}}
      User.find(criteria, (err, userResult) => {
        res.json({ success: true, users: userResult});
      })
    }
  })
})

app.get('/chat', function(req, res) {
  console.log('@@chat', req.user._id, req.query.id)
  Offer.find({$or:
    [{ $and: [{sender: req.user._id}, {receiver: req.query.id}]},
     { $and: [{sender: req.query.id}, {receiver: req.user._id}]}
    ]
  }, (error, results) => {
    console.log('@@sending back offers', results)
    res.json({ success: true, offers: results })
  })
})

app.listen(process.env.PORT || 1337);
console.log('listening on port 1337')
