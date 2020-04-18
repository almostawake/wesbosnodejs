const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, 
        required: 'Please enter a store name'
    }, 
    slug: String,
    description: {
        type: String,
        trim: true
    }, 
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String, 
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates'
        }], 
        address: {
            type: String,
            required: 'You must provide an address'
        }
    },
    photo: String, 
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
});



storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next();
        return;
    };
    this.slug = slug(this.name);
    const slugRegex = new RegExp(`^(${this.slug})((-[1-9]*$)?)$`, 'i');
    const stores = await this.constructor.find({slug: slugRegex});
    if(stores.length) {
      this.slug = `${this.slug}-${stores.length}`;
    };
    next();
});

storeSchema.statics.getTagList = function() {
  return this.aggregate([
    {$unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } }},
    { $sort: {count: -1 }}
  ]);
};

// Define our indexes

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

module.exports = mongoose.model('Store', storeSchema);