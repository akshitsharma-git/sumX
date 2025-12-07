const axios = require("axios");
const redis = require("../redis.js");
const Groq = require("groq-sdk");
require("dotenv").config();


const SCRAPINGDOG_API_BASE = "https://api.scrapingdog.com/x/post";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractTweetId = (url) => {
  const match = url.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/);
  return match ? match[1] : null;
};

const handleHome = async (req, res) => {
  const SCRAPER_API_KEY = process.env.SCRAPINGDOG_API_KEY;
  const { url } = req.body;

  const tweetId = extractTweetId(url);
  if (!tweetId || !SCRAPER_API_KEY) {
    return res
      .status(400)
      .json({ success: false, message: "Missing URL or API key." });
  }

  const cacheKey = `sumX:${tweetId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (err) {}

  let tweetObject;
  try {
    const scraperResponse = await axios.get(SCRAPINGDOG_API_BASE, {
      params: {
        api_key: SCRAPER_API_KEY,
        tweetId,
        parsed: "true",
      },
      timeout: 70000,
    });

    const data = scraperResponse.data;
    tweetObject = Array.isArray(data) ? data[0] : data;

    if (!tweetObject) {
      return res.status(404).json({
        success: false,
        message: "ScrapingDog returned empty or unsupported data.",
      });
    }
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: "Scraping service failed or rate limit hit. Try again shortly.",
    });
  }

  const tweetText = tweetObject.full_tweet || tweetObject.tweet;
  if (!tweetText?.trim()) {
    return res.status(404).json({
      success: false,
      message: "Tweet text empty or unsupported.",
    });
  }

  let summary;

  try {
    const groqResult = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Summarize this social media post in a single paragraph. The summary must be direct, formal, and strictly concise. Start with "Here's the summary:" Add a line space after here's the summary.\n\n${tweetText}`,
        },
      ],
    });

    summary = groqResult.choices[0].message.content;
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: "AI summarization service unavailable. Try again later.",
    });
  }

  const responseData = {
    success: true,
    tweetText,
    summary,
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 3600);
  } catch (err) {}

  return res.json(responseData);
};

module.exports = { handleHome };
