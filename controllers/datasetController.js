const Dataset = require("../models/Dataset");
const DatasetRecords = require("../models/DatasetRecords");
const {
  applyFilter,
  applySearch,
  applySort,
  paginateRows,
  buildStats,
  buildChartData,
  buildInsights,
  buildCleaningSuggestions,
} = require("../utils/datasetAnalytics");
const {
  buildStoredFilePath,
  convertRowsToCsv,
  getAbsoluteDatasetFilePath,
  getOwnedDatasetData,
  parseCsvFile,
  removeUploadedFile,
  sendDatasetNotFound,
} = require("../utils/datasetAccess");

const buildDatasetOverview = (dataset) => ({
  id: dataset._id,
  datasetName: dataset.datasetName,
  columnNames: dataset.columnNames,
  rowCount: dataset.rowCount,
  columnCount: dataset.columnCount,
});

const uploadDataset = async (req, res, next) => {
  try {
    const { datasetName, category, description } = req.body;

    if (!datasetName?.trim()) {
      removeUploadedFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: "Dataset name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const parsedCsv = await parseCsvFile(req.file.path);

    const dataset = await Dataset.create({
      userId: req.user.userId,
      datasetName: datasetName.trim(),
      category: category?.trim() || "General",
      description: description?.trim() || "",
      fileName: req.file.filename,
      filePath: buildStoredFilePath(req.file.path),
      columnNames: parsedCsv.columnNames,
      rowCount: parsedCsv.rows.length,
      columnCount: parsedCsv.columnNames.length,
    });

    await DatasetRecords.create({
      datasetId: dataset._id,
      data: parsedCsv.rows,
    });

    return res.status(201).json({
      success: true,
      message: "Dataset uploaded successfully",
      dataset,
      preview: parsedCsv.rows.slice(0, 10),
    });
  } catch (error) {
    removeUploadedFile(req.file?.path);
    return next(error);
  }
};

const getMyDatasets = async (req, res, next) => {
  try {
    const datasets = await Dataset.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: datasets.length,
      datasets,
    });
  } catch (error) {
    return next(error);
  }
};

const getDatasetSummary = async (req, res, next) => {
  try {
    const datasetsResponse = await Dataset.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    const datasets = datasetsResponse.map((dataset) => ({
      ...dataset,
      rowCount: Number(dataset.rowCount || 0),
      columnCount: Number(dataset.columnCount || 0),
    }));

    const totalDatasets = datasets.length;
    const totalRecords = datasets.reduce((sum, dataset) => sum + (dataset.rowCount || 0), 0);
    const recentUploads = datasets.slice(0, 5).length;
    const reportsGenerated = datasets.filter((dataset) => dataset.rowCount > 0).length;

    let quickInsights = [];

    if (datasets[0]) {
      const recentDatasetRecords = await DatasetRecords.findOne({ datasetId: datasets[0]._id });
      const rows = recentDatasetRecords?.data || [];
      const stats = buildStats(rows, datasets[0].columnNames || []);
      const cleaning = buildCleaningSuggestions(rows, datasets[0].columnNames || []);
      quickInsights = buildInsights(stats, cleaning).slice(0, 3);
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalDatasets,
        totalRecords,
        recentUploads,
        reportsGenerated,
      },
      quickInsights,
      recentActivity: datasets.slice(0, 5).map((dataset) => ({
        id: dataset._id,
        datasetName: dataset.datasetName,
        category: dataset.category,
        fileName: dataset.fileName,
        uploadedAt: dataset.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const getDatasetDetails = async (req, res, next) => {
  try {
    const datasetData = await getOwnedDatasetData(req.params.datasetId, req.user.userId);

    if (!datasetData) {
      return sendDatasetNotFound(res);
    }

    const stats = buildStats(datasetData.rows, datasetData.dataset.columnNames);
    const preview = paginateRows(datasetData.rows, 1, 10);

    return res.status(200).json({
      success: true,
      dataset: datasetData.dataset,
      stats,
      preview,
    });
  } catch (error) {
    return next(error);
  }
};

const getDatasetRecords = async (req, res, next) => {
  try {
    const datasetData = await getOwnedDatasetData(req.params.datasetId, req.user.userId);

    if (!datasetData) {
      return sendDatasetNotFound(res);
    }

    const numericColumns = buildStats(datasetData.rows, datasetData.dataset.columnNames).numericColumns;
    let rows = applySearch(datasetData.rows, req.query.search);
    rows = applyFilter(rows, req.query, numericColumns);
    rows = applySort(rows, req.query.sortBy, req.query.sortOrder, numericColumns);

    const paginated = paginateRows(rows, req.query.page, req.query.limit);

    return res.status(200).json({
      success: true,
      dataset: buildDatasetOverview(datasetData.dataset),
      query: {
        search: req.query.search || "",
        filterColumn: req.query.filterColumn || "",
        filterOperator: req.query.filterOperator || "",
        filterValue: req.query.filterValue || "",
        sortBy: req.query.sortBy || "",
        sortOrder: req.query.sortOrder || "asc",
      },
      pagination: {
        page: paginated.page,
        limit: paginated.limit,
        totalRows: paginated.totalRows,
        totalPages: paginated.totalPages,
      },
      rows: paginated.rows,
    });
  } catch (error) {
    return next(error);
  }
};

const getDatasetStats = async (req, res, next) => {
  try {
    const datasetData = await getOwnedDatasetData(req.params.datasetId, req.user.userId);

    if (!datasetData) {
      return sendDatasetNotFound(res);
    }

    const stats = buildStats(datasetData.rows, datasetData.dataset.columnNames);
    const preferredNumericColumn = req.query.yAxis || stats.numericColumns[0];
    const chartData = buildChartData(
      datasetData.rows,
      datasetData.dataset.columnNames,
      preferredNumericColumn,
      req.query.xAxis
    );

    return res.status(200).json({
      success: true,
      stats,
      chartData,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteDataset = async (req, res, next) => {
  try {
    const datasetData = await getOwnedDatasetData(req.params.datasetId, req.user.userId);

    if (!datasetData) {
      return sendDatasetNotFound(res);
    }

    removeUploadedFile(getAbsoluteDatasetFilePath(datasetData.dataset.filePath));

    await DatasetRecords.deleteOne({ datasetId: datasetData.dataset._id });
    await Dataset.deleteOne({ _id: datasetData.dataset._id });

    return res.status(200).json({
      success: true,
      message: "Dataset deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const downloadDataset = async (req, res, next) => {
  try {
    const datasetData = await getOwnedDatasetData(req.params.datasetId, req.user.userId);

    if (!datasetData) {
      return sendDatasetNotFound(res);
    }

    const csvContent = convertRowsToCsv(datasetData.rows, datasetData.dataset.columnNames || []);
    const safeFileName = `${datasetData.dataset.datasetName || "dataset"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName || "dataset"}-cleaned.csv"`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadDataset,
  getMyDatasets,
  getDatasetSummary,
  getDatasetDetails,
  getDatasetRecords,
  getDatasetStats,
  deleteDataset,
  downloadDataset,
};
