const axios = require("axios");
const redis=require("../redis.js");

const SCRAPINGDOG_API_BASE = "https://api.scrapingdog.com/x/post";

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

  const cacheKey=`sumX:${tweetId}`;

  const cached=await redis.get(cacheKey);
  if(cached){
    console.log("Cache hit for ",tweetId);
    return res.json(JSON.parse(cached));
  }

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
    const tweetObject = Array.isArray(data) ? data[0] : data;

    if (!tweetObject) {
      return res.status(404).json({
        success: false,
        message: "ScrapingDog returned empty or unsupported data.",
      });
    }

    const tweetText = tweetObject.full_tweet || tweetObject.tweet;
    if (!tweetText?.trim()) {
      return res.status(404).json({
        success: false,
        message: "Tweet text field was empty; post may be un-scrapable.",
      });
    }

    const prompt = `Summarize this social media post in a single paragraph. The summary must be direct, formal, and strictly concise. Start with "Here's the summary" Add a line space after here's the summary.\n\n${tweetText}`;

    const aiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    const summary =
      aiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!summary) {
      return res
        .status(500)
        .json({ success: false, message: "AI summarization failed." });
    }

    const responseData={
      success:true,
      tweetText,
      summary,
      fromCache:false
    }

    await redis.set(cacheKey,JSON.stringify(responseData),"EX",600);

    return res.json(responseData);
  } catch (err) {
    console.error("Error:", err.message);

    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
        return res
          .status(504)
          .json({ success: false, message: "Request timed out." });
      }
      return res.status(err.response?.status || 500).json({
        success: false,
        message: "API request failed.",
        details: err.response?.data || err.message,
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = { handleHome };
