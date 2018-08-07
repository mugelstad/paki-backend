var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
if(!process.env.MONGODB_URI) throw new Error('uri missing');

var userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  house: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: false
  },
  work: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work',
    required: false
  },
  interested: {
    type: Array,
    required: false
  }
});

var houseSchema = new Schema({
  sqft: {
    type: Number,
    required: true
  },
  latitude:{
    type: String,
    required: true
  },
  longitude: {
    type: String,
    required: true
  },
  monthlyRent: {
    type: Number,
    required: true
  }
})

var workSchema = new Schema ({
  latitude: {
     type: String,
     required: true
  },
   longitude: {
     type: String,
     required: true
   }
})

var pictureSchema = new Schema({
  img: {
    data: Buffer,
    contentType: String
  }
})

var User = mongoose.model('User', userSchema);
var House = mongoose.model('House', houseSchema)
var Work = mongoose.model('Work', workSchema)
var Picture = mongoose.model('Picture', pictureSchema)

module.exports = {
  User,
  House,
  Work,
  Picture
};
