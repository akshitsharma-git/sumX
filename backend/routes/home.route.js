const express = require("express");
const router = express.Router();
const { handleHome } = require("../controllers/home.controller");

router.post("/", handleHome);

module.exports = router;
    