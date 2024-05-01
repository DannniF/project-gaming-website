const ObjectId = require('mongodb').ObjectId;
const Reviews = require('../models/Reviews');


async function getReviewsByUser(req, res) {
  const userId = req.query.userId;

  try {
    console.log('reviews', userId, Reviews);
    const reviews = await Reviews.find({ userId: new ObjectId(userId) });
    console.log('reviews', reviews);
    res.json({ reviews: reviews });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

module.exports = { getReviewsByUser };
