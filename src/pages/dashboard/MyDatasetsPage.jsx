import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import { deleteDataset, downloadDatasetFile, fetchMyDatasets } from "../../services/datasetService";

export default function MyDatasetsPage() {
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetchMyDatasets(auth.token);
        setDatasets(response.datasets || []);
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load datasets right now"
          : "Unable to load datasets right now";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, [auth.token]);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery) {
      return datasets;
    }

    return datasets.filter((dataset) =>
      [dataset.datasetName, dataset.category, dataset.fileName, dataset.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchQuery))
    );
  }, [datasets, searchQuery]);

  const handleDeleteDataset = async (datasetId) => {
    try {
      const response = await deleteDataset(auth.token, datasetId);
      setDatasets((current) => current.filter((dataset) => dataset._id !== datasetId));
      setSuccess(response.message || "Dataset deleted successfully");
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to delete dataset right now"
        : "Unable to delete dataset right now";
      setError(message);
      setSuccess("");
    }
  };

  const handleDownloadDataset = async (datasetId, datasetName) => {
    try {
      await downloadDatasetFile(auth.token, datasetId, datasetName);
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to download dataset right now"
        : "Unable to download dataset right now";
      setError(message);
      setSuccess("");
    }
  };

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero">
          <div>
            <span className="hero-badge">Dataset Library</span>
            <h1 className="dashboard-title">Manage your uploaded files</h1>
            <p className="dashboard-subtitle">
              Review file metadata, keep storage organized, and download cleaned datasets.
            </p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">{datasets.length} stored files</span>
              <span className="dashboard-context-chip">{filteredDatasets.length} visible results</span>
            </div>
          </div>

          <div className="dashboard-surface-actions">
            <div className="dashboard-page-status">
              <span>Results</span>
              <strong>{filteredDatasets.length}</strong>
            </div>
          </div>
        </section>

        <FormAlert type="success" message={success} />
        <FormAlert message={error} />

        <section className="dashboard-surface dashboard-surface-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="stat-label mb-2">My Datasets</p>
              <h2>{searchQuery ? `Search results for “${searchQuery}”` : "Your workspace files"}</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="dashboard-skeleton-grid">
              <div className="dashboard-skeleton dashboard-skeleton-card" />
              <div className="dashboard-skeleton dashboard-skeleton-card" />
            </div>
          ) : filteredDatasets.length ? (
            <div className="dashboard-library-grid">
              {filteredDatasets.map((dataset) => (
                <article key={dataset._id} className="dashboard-library-card">
                  <div className="dashboard-library-head">
                    <span className="feature-chip">{dataset.category || "General"}</span>
                    <span className="dataset-date">
                      {new Date(dataset.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="dashboard-library-copy">
                    <h3>{dataset.datasetName}</h3>
                    <p>{dataset.description || "No description added yet."}</p>
                  </div>

                  <div className="dashboard-library-stats">
                    <span>{dataset.rowCount || 0} rows</span>
                    <span>{dataset.columnCount || 0} columns</span>
                  </div>

                  <dl className="dataset-meta">
                    <div>
                      <dt>File</dt>
                      <dd>{dataset.fileName}</dd>
                    </div>
                    <div>
                      <dt>Uploaded</dt>
                      <dd>{new Date(dataset.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>

                  <div className="dataset-actions">
                    <button
                      type="button"
                      className="btn hero-primary-btn"
                      onClick={() => handleDownloadDataset(dataset._id, dataset.datasetName)}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary hero-secondary-btn"
                      onClick={() => handleDeleteDataset(dataset._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state dashboard-empty-state-left">
              <h3>{searchQuery ? "No matching datasets" : "No datasets uploaded yet"}</h3>
              <p>
                {searchQuery
                  ? "Try a different search in the top bar to find the right dataset."
                  : "Upload a CSV file to start building charts, insights, and cleaner workflows."}
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
