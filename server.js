//Dependencies to create server
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json())

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
mongoose.connection.on('connected', function(){
  console.log('connected to mongoose')
})

//Cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
      if (user.password === req.body.password){
        res.send({success: true})
      } else {
        res.send({success: false})
      }
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

app.get('/switchPhotos', function(req, res){
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
      res.json({success: true, pictures: pictures})
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



    // House.findById(query.parmas.houseId, (err, house) => {
    //   if (err) {
    //     res.json({success: false})
    //   } else {
    //     var pictures = [];
    //     //Find images by _id and render in Switch Screen
    //     house.images.map(imageId => {
    //       Picture.findById(imageId, (err, picture) => {
    //         if (err){
    //           res.json({success: false})
    //         } else {
    //           pictures = pictures.concat([picture.img.data.toString('base64')])
    //         }
    //       })
    //     })
    //     res.json({success: true, pictures: pictures})
    //   }


  // Picture.find({/*all*/}, (err, pic) => {
  //   if (err){
  //     res.json({success: false})
  //   }
  //
  //   var pictures = [];
  //   pic.map(pic => {
  //     pictures = pictures.concat([pic.img.data.toString('base64')]);
  //   })
  //   res.json({success: true, pictures: pictures})
  // })



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
