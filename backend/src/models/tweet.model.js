const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  tweetId: { type: String, required: true, unique: true },
  tweetURL: { type: String, required: true },
  tweetText: { type: String },
  isThread: { type: Boolean, default: false },
  threadTweets: [{ tweetId: String, content: String, order: Number }],
  fullTweet: { type: String, required: true },
  summary: { type: String, required: true },
});

module.exports=mongoose.model("Tweet",tweetSchema);