import { apiClient, withAuth } from "./apiClient";

export const fetchCleaningSuggestions = async (token, datasetId) => {
  const response = await apiClient.get(`/ai/datasets/${datasetId}/cleaner`, withAuth(token));

  return response.data;
};

export const applyCleaningOperations = async (token, datasetId, operations) => {
  const response = await apiClient.post(
    `/ai/datasets/${datasetId}/clean`,
    { operations },
    withAuth(token)
  );

  return response.data;
};

export const fetchInsights = async (token, datasetId) => {
  const response = await apiClient.get(`/ai/datasets/${datasetId}/insights`, withAuth(token));

  return response.data;
};
