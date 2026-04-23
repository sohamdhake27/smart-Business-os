const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");

// ✅ IMPORTANT: these must exist
router.post("/register", register);
router.post("/login", login);

module.exports = router;