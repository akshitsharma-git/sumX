const axios = require('axios'); 

const SCRAPINGDOG_API_BASE = 'https://api.scrapingdog.com/x/post';

const extractTweetId = (url) => {
    const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/); 
    return match ? match[1] : null;
};

const handleHome = async(req, res) => {
    const SCRAPER_API_KEY = process.env.SCRAPINGDOG_API_KEY; 

    const { url } = req.body;
    const tweetId = extractTweetId(url);

    if (!tweetId || !SCRAPER_API_KEY) {
        return res.status(400).json({ success: false, error: "Missing URL or API key." });
    }
    
    const params = {
        api_key: SCRAPER_API_KEY,
        tweetId: tweetId,
        parsed: "true" 
    };
    
    console.log('Fetching tweet via Scrapingdog X Post API');
    
    try {
        const scraperResponse = await axios.get(SCRAPINGDOG_API_BASE, {
            params: params,
            timeout: 70000, 
            responseType: 'json',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });
        

        const scraperData = scraperResponse.data;
        let tweetObject = null;
        
        if (Array.isArray(scraperData) && scraperData.length > 0) {
            tweetObject = scraperData[0];
        } else if (typeof scraperData === 'object' && scraperData !== null) {
            if (scraperData.error) {
                console.error('ScrapingDog API returned internal error object:', scraperData.error);
                return res.status(500).json({ success: false, error: "ScrapingDog API returned internal error.", details: scraperData.error });
            }
            tweetObject = scraperData;
        }


        if (!tweetObject) {
            console.error('ScrapingDog returned empty or unsupported data format.');
            return res.status(404).json({ success: false, error: "ScrapingDog returned empty or unsupported data." });
        }
        

        const tweetText = tweetObject.full_tweet || tweetObject.tweet; 
        
        if (!tweetText || tweetText.trim().length === 0) {
            console.error('ScrapingDog successfully received an object but both text fields were empty/null.');
            return res.status(404).json({ success: false, error: "Tweet text field was empty, post may be un-scrapable." });
        }
        



        const isThread = false; 
        const promptText = `Summarize this social media post in a single paragraph. The summary must be direct, formal, and strictly concise. Start the response with "Here's the summary" and then leave exactly one line space. Do not include any introductory phrases, filler text, or concluding remarks :\n\n${tweetText}`;

        const aiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: promptText }] }] },
            { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        
        const summary = aiResponse.data.candidates[0]?.content.parts[0]?.text;

        if (!summary) {
             return res.status(500).json({ success: false, error: "AI Summarization Failed." });
        }

        res.json({
            success: true,
            isThread: isThread,
            tweetCount: 1, 
            tweetText: tweetText,
            summary: summary
        });

    } catch(err) {
        if (axios.isAxiosError(err)) {
            if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
                console.error('Axios Request Timed Out (70s limit)');
                return res.status(504).json({ success: false, error: "Request timed out after 70 seconds." });
            }
            if (err.response) {
                const status = err.response.status;
                const errorDetails = err.response.data?.error || err.response.data || err.message;
                return res.status(status).json({ success: false, error: `API Request Failed (Status ${status}).`, details: errorDetails });
            }
        }
        
        console.error('General Error in handleHome:', err.message);
        res.status(500).json({
            success: false,
            error: `Internal Server Error: ${err.message}`
        });
    }
};

module.exports = { handleHome };