const Dataset = require("../models/Dataset");
const DatasetRecords = require("../models/DatasetRecords");
const {
  buildCleaningSuggestions,
  buildStats,
  buildInsights,
  buildChartData,
  applyCleaningOperations,
} = require("../utils/datasetAnalytics");
const { getOwnedDatasetData, sendDatasetNotFound } = require("../utils/datasetAccess");

const buildDatasetSummary = (dataset) => ({
  id: dataset._id,
  datasetName: dataset.datasetName,
  rowCount: dataset.rowCount,
  columnCount: dataset.columnCount,
});

const sendValidationError = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const getSafeRows = (datasetData) => {
  if (Array.isArray(datasetData?.rows)) {
    return datasetData.rows;
  }

  if (Array.isArray(datasetData?.records?.data)) {
    return datasetData.records.data;
  }

  return [];
};

const getSafeColumnNames = (datasetData, rows) => {
  if (Array.isArray(datasetData?.columnNames) && datasetData.columnNames.length) {
    return datasetData.columnNames;
  }

  if (Array.isArray(datasetData?.dataset?.columnNames) && datasetData.dataset.columnNames.length) {
    return datasetData.dataset.columnNames;
  }

  if (rows[0] && typeof rows[0] === "object") {
    return Object.keys(rows[0]);
  }

  return [];
};

const getDatasetContext = async (datasetId, userId) => {
  const datasetData = await getOwnedDatasetData(datasetId, userId);

  if (!datasetData?.dataset) {
    return null;
  }

  const rows = getSafeRows(datasetData);
  const columnNames = getSafeColumnNames(datasetData, rows);

  return {
    dataset: datasetData.dataset,
    rows,
    columnNames,
  };
};

const getCleaningSuggestions = async (req, res, next) => {
  try {
    const datasetContext = await getDatasetContext(req.params.datasetId, req.user.userId);

    if (!datasetContext) {
      return sendDatasetNotFound(res);
    }

    const cleaning = buildCleaningSuggestions(datasetContext.rows, datasetContext.columnNames);

    return res.status(200).json({
      success: true,
      dataset: buildDatasetSummary(datasetContext.dataset),
      cleaning,
      source: "rule-based",
    });
  } catch (error) {
    return next(error);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const datasetContext = await getDatasetContext(req.params.datasetId, req.user.userId);

    if (!datasetContext) {
      return sendDatasetNotFound(res);
    }

    const stats = buildStats(datasetContext.rows, datasetContext.columnNames);
    const cleaning = buildCleaningSuggestions(datasetContext.rows, datasetContext.columnNames);
    const preferredNumericColumn = stats.numericColumns?.[0] || datasetContext.columnNames[0] || "";
    const chartData = buildChartData(
      datasetContext.rows,
      datasetContext.columnNames,
      preferredNumericColumn
    );

    return res.status(200).json({
      success: true,
      source: "rule-based",
      stats,
      insights: buildInsights(stats, cleaning),
      chartData,
    });
  } catch (error) {
    return next(error);
  }
};

const applyCleaning = async (req, res, next) => {
  try {
    const datasetContext = await getDatasetContext(req.params.datasetId, req.user.userId);

    if (!datasetContext) {
      return sendDatasetNotFound(res);
    }

    const { operations = [] } = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
      return sendValidationError(res, "At least one cleaning operation is required");
    }

    const { cleanedRows, cleanedColumnNames, cleaningSummary } = applyCleaningOperations(
      datasetContext.rows,
      [...datasetContext.columnNames],
      operations
    );

    await DatasetRecords.findOneAndUpdate(
      { datasetId: datasetContext.dataset._id },
      { data: cleanedRows },
      { new: true, upsert: true }
    );

    await Dataset.findByIdAndUpdate(datasetContext.dataset._id, {
      rowCount: cleanedRows.length,
      columnNames: cleanedColumnNames,
      columnCount: cleanedColumnNames.length,
    });

    return res.status(200).json({
      success: true,
      message: "Cleaning applied successfully",
      cleaningSummary,
      dataset: {
        id: datasetContext.dataset._id,
        rowCount: cleanedRows.length,
        columnCount: cleanedColumnNames.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCleaningSuggestions,
  getInsights,
  applyCleaning,
};
