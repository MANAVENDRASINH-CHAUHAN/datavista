const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const Dataset = require("../models/Dataset");
const DatasetRecords = require("../models/DatasetRecords");

const DATASET_NOT_FOUND_MESSAGE = "Dataset not found";

const sendDatasetNotFound = (res) =>
  res.status(404).json({
    success: false,
    message: DATASET_NOT_FOUND_MESSAGE,
  });

const removeUploadedFile = (filePath) => {
  if (!filePath) {
    return;
  }

  fs.unlink(filePath, () => {});
};

const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    let columnNames = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        columnNames = headers.map((header) => header.trim());
      })
      .on("data", (row) => {
        const cleanedRow = {};

        Object.entries(row).forEach(([key, value]) => {
          cleanedRow[key.trim()] = typeof value === "string" ? value.trim() : value;
        });

        rows.push(cleanedRow);
      })
      .on("end", () => resolve({ rows, columnNames }))
      .on("error", reject);
  });

const convertRowsToCsv = (rows, columnNames) => {
  const headerRow = columnNames.join(",");
  const bodyRows = rows.map((row) =>
    columnNames
      .map((columnName) => {
        const rawValue = row[columnName] ?? "";
        const safeValue = String(rawValue).replace(/"/g, '""');
        return `"${safeValue}"`;
      })
      .join(",")
  );

  return [headerRow, ...bodyRows].join("\n");
};

const buildStoredFilePath = (absoluteFilePath) =>
  path.relative(path.join(__dirname, ".."), absoluteFilePath).replace(/\\/g, "/");

const getAbsoluteDatasetFilePath = (storedFilePath) =>
  path.join(__dirname, "..", storedFilePath);

const getOwnedDatasetData = async (datasetId, userId) => {
  const dataset = await Dataset.findOne({ _id: datasetId, userId });

  if (!dataset) {
    return null;
  }

  const records = await DatasetRecords.findOne({ datasetId: dataset._id });

  return {
    dataset,
    records,
    rows: records?.data || [],
    columnNames: dataset.columnNames || [],
  };
};

module.exports = {
  buildStoredFilePath,
  convertRowsToCsv,
  getAbsoluteDatasetFilePath,
  getOwnedDatasetData,
  parseCsvFile,
  removeUploadedFile,
  sendDatasetNotFound,
};
