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
  interested: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'House',
    required: false
  }],
  offers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: false
  }]
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
  },
  images: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Picture',
      required: false
    }],
  address: {
    type: String
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
   },
   address: {
     type: String
   }
})

var pictureSchema = new Schema({
  img: {
    data: Buffer,
    contentType: String
  }
})

var offerSchema = new Schema({
  accepted: {
    type: Boolean,
    required: true,
    default: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  time: {
    type: Date,
    default: new Date()
  },
  amount: {
    type: Number,
    required: true
  }
})

var User = mongoose.model('User', userSchema);
var House = mongoose.model('House', houseSchema)
var Work = mongoose.model('Work', workSchema)
var Picture = mongoose.model('Picture', pictureSchema)
var Offer = mongoose.model('Offer', offerSchema)
module.exports = {
  User,
  House,
  Work,
  Picture,
  Offer
};
