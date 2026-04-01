const express = require("express");

const {
  uploadDataset,
  getMyDatasets,
  getDatasetSummary,
  getDatasetDetails,
  getDatasetRecords,
  getDatasetStats,
  deleteDataset,
  downloadDataset,
} = require("../controllers/datasetController");
const { protect } = require("../middleware/authMiddleware");
const { uploadDatasetFile } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/summary", protect, getDatasetSummary);
router.get("/mine", protect, getMyDatasets);
router.get("/:datasetId", protect, getDatasetDetails);
router.get("/:datasetId/records", protect, getDatasetRecords);
router.get("/:datasetId/stats", protect, getDatasetStats);
router.get("/:datasetId/download", protect, downloadDataset);
router.post("/", protect, uploadDatasetFile.single("datasetFile"), uploadDataset);
router.delete("/:datasetId", protect, deleteDataset);

module.exports = router;
