const express = require("express");
const router = express.Router();
const { handleHome } = require("../controllers/home.controller");
const rateLimitMiddleware =require("../middlewares/rateLimiter.js")

router.post("/",rateLimitMiddleware,handleHome);

module.exports = router;
    