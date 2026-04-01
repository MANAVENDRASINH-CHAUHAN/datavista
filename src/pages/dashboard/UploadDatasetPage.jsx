import { useMemo, useState } from "react";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import { uploadDataset } from "../../services/datasetService";

const initialState = {
  datasetName: "",
  category: "Education",
  description: "",
};

const categoryOptions = [
  "Education",
  "Sales",
  "Finance",
  "Healthcare",
  "Marketing",
  "Operations",
  "Research",
];

export default function UploadDatasetPage() {
  const { auth } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const filePreview = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return {
      name: selectedFile.name,
      size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
      type: selectedFile.type || "text/csv",
    };
  }, [selectedFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleFileChange = (event) => {
    handleFileSelection(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.datasetName.trim()) {
      setError("Dataset name is required");
      setSuccess("");
      return;
    }

    if (!selectedFile) {
      setError("Please select a CSV file");
      setSuccess("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.append("datasetName", formData.datasetName);
      payload.append("category", formData.category);
      payload.append("description", formData.description);
      payload.append("datasetFile", selectedFile);

      const response = await uploadDataset(auth.token, payload);

      setSuccess(response.message || "Dataset uploaded successfully");
      setFormData(initialState);
      setSelectedFile(null);
      event.target.reset();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to upload dataset right now"
        : "Unable to upload dataset right now";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero dashboard-surface-hero-grid">
          <div>
            <span className="hero-badge">Upload Dataset</span>
            <h1 className="dashboard-title">Bring new data into DataVista</h1>
            <p className="dashboard-subtitle">
              Upload a CSV file, organize it with clear metadata, and prepare it for cleaning and analytics.
            </p>
          </div>

          <div className="dashboard-hero-sidecard">
            <div className="dashboard-hero-sidecard-head">
              <span className="feature-chip">Upload checklist</span>
              <span className="dashboard-hero-sidecard-status">CSV only</span>
            </div>
            <div className="dashboard-upload-checklist">
              <span>Name your dataset clearly</span>
              <span>Choose a business category</span>
              <span>Attach a clean CSV file</span>
            </div>
          </div>
        </section>

        <FormAlert type="success" message={success} />
        <FormAlert message={error} />

        <div className="dashboard-grid dashboard-grid-uneven">
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">Dataset Form</p>
                <h2>Dataset metadata</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-premium-form">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="datasetName" className="form-label">
                    Dataset Name
                  </label>
                  <input
                    id="datasetName"
                    name="datasetName"
                    className="form-control"
                    placeholder="Student performance 2026"
                    value={formData.datasetName}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="category" className="form-label">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control dashboard-textarea"
                    placeholder="Add context about columns, source, or purpose of this dataset"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="btn auth-submit-btn mt-4" disabled={isSubmitting}>
                {isSubmitting ? "Uploading..." : "Upload Dataset"}
              </button>
            </form>
          </section>

          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">File Dropzone</p>
                <h2>Drag and drop your CSV</h2>
              </div>
            </div>

            <label
              htmlFor="datasetFile"
              className={`dashboard-dropzone ${isDragging ? "is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFileSelection(event.dataTransfer.files?.[0] || null);
              }}
            >
              <input
                id="datasetFile"
                type="file"
                accept=".csv"
                className="dashboard-hidden-input"
                onChange={handleFileChange}
              />

              <div className="dashboard-dropzone-icon">CSV</div>
              <strong>Drop your file here</strong>
              <p>or click to browse from your device</p>
            </label>

            {filePreview ? (
              <article className="dashboard-file-preview">
                <div>
                  <span className="feature-chip">Selected file</span>
                  <h3>{filePreview.name}</h3>
                  <p>{filePreview.type}</p>
                </div>
                <div className="dashboard-file-preview-stats">
                  <span>{filePreview.size}</span>
                </div>
              </article>
            ) : (
              <div className="dashboard-empty-state dashboard-empty-state-left">
                <h3>No file selected</h3>
                <p>Once you choose a CSV file, its name and size will appear here.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
