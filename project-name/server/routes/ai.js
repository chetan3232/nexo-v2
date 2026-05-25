const express = require("express");
const router = express.Router();
const AIGateway = require("../services/aiGateway");

router.post("/chat", AIGateway.handleRequest);

module.exports = router;
