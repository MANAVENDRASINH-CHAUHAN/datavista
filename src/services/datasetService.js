import { apiClient, withAuth } from "./apiClient";

export const fetchDatasetSummary = async (token) => {
  const response = await apiClient.get("/datasets/summary", withAuth(token));
  return response.data;
};

export const fetchMyDatasets = async (token) => {
  const response = await apiClient.get("/datasets/mine", withAuth(token));
  return response.data;
};

export const fetchDatasetDetails = async (token, datasetId) => {
  const response = await apiClient.get(`/datasets/${datasetId}`, withAuth(token));
  return response.data;
};

export const fetchDatasetRecords = async (token, datasetId, params = {}) => {
  const response = await apiClient.get(
    `/datasets/${datasetId}/records`,
    withAuth(token, {
      params,
    })
  );
  return response.data;
};

export const fetchDatasetStats = async (token, datasetId, params = {}) => {
  const response = await apiClient.get(
    `/datasets/${datasetId}/stats`,
    withAuth(token, {
      params,
    })
  );
  return response.data;
};

export const uploadDataset = async (token, formData) => {
  const response = await apiClient.post(
    "/datasets",
    formData,
    withAuth(token, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );

  return response.data;
};

export const deleteDataset = async (token, datasetId) => {
  const response = await apiClient.delete(`/datasets/${datasetId}`, withAuth(token));

  return response.data;
};

export const downloadDatasetFile = async (token, datasetId, datasetName = "dataset") => {
  const response = await apiClient.get(
    `/datasets/${datasetId}/download`,
    withAuth(token, {
      responseType: "blob",
    })
  );

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `${datasetName || "dataset"}-cleaned.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
};
