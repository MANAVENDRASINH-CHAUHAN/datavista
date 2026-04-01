const express = require("express");

const {
  getCleaningSuggestions,
  getInsights,
  applyCleaning,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/datasets/:datasetId/cleaner", protect, getCleaningSuggestions);
router.post("/datasets/:datasetId/clean", protect, applyCleaning);
router.get("/datasets/:datasetId/insights", protect, getInsights);

module.exports = router;
