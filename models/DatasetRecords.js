const mongoose = require("mongoose");

const datasetRecordsSchema = new mongoose.Schema(
  {
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DatasetRecords", datasetRecordsSchema);
