import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import DatasetWorkspaceTabs from "../../components/layout/DatasetWorkspaceTabs";
import { useAuth } from "../../hooks/useAuth";
import { applyCleaningOperations, fetchCleaningSuggestions } from "../../services/aiService";

export default function DataCleanerPage() {
  const { datasetId } = useParams();
  const { auth } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [cleaning, setCleaning] = useState(null);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columnRename, setColumnRename] = useState({ from: "", to: "" });
  const [columnDelete, setColumnDelete] = useState("");
  const [defaultFill, setDefaultFill] = useState({ column: "", value: "" });

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetchCleaningSuggestions(auth.token, datasetId);
        setDataset(response.dataset);
        setCleaning(response.cleaning);
        setSelectedOperations(
          [...new Set((response.cleaning?.suggestions || []).map((item) => item.type))]
        );
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load cleaning suggestions right now"
          : "Unable to load cleaning suggestions right now";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [auth.token, datasetId]);

  const toggleOperation = (operation) => {
    setSelectedOperations((current) =>
      current.includes(operation)
        ? current.filter((item) => item !== operation)
        : [...current, operation]
    );
  };

  const handleApplyCleaning = async () => {
    const advancedOperations = [];

    if (columnRename.from && columnRename.to) {
      advancedOperations.push({
        type: "renameColumn",
        from: columnRename.from,
        to: columnRename.to,
      });
    }

    if (columnDelete) {
      advancedOperations.push({
        type: "deleteColumn",
        column: columnDelete,
      });
    }

    if (defaultFill.column && defaultFill.value) {
      advancedOperations.push({
        type: "fillMissingDefault",
        column: defaultFill.column,
        value: defaultFill.value,
      });
    }

    const operations = [...selectedOperations, ...advancedOperations];

    if (!operations.length) {
      setError("Select at least one cleaning operation");
      setSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await applyCleaningOperations(auth.token, datasetId, operations);
      setSuccess(response.cleaningSummary.join(" "));
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to apply cleaning right now"
        : "Unable to apply cleaning right now";
      setError(message);
      setSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero dashboard-surface-hero-grid">
          <div>
            <span className="hero-badge">AI Data Cleaner</span>
            <h1 className="dashboard-title">{dataset?.datasetName || "Dataset cleaner"}</h1>
            <p className="dashboard-subtitle">
              Detect missing values, duplicates, and inconsistent formatting before deeper analysis.
            </p>
          </div>

          <div className="dashboard-surface-actions">
            <Link to="/dashboard/analyze" className="btn btn-outline-secondary hero-secondary-btn">
              Back to Analyze
            </Link>
          </div>
        </section>

        <DatasetWorkspaceTabs datasetId={datasetId} />

        <FormAlert type="success" message={success} />
        <FormAlert message={error} />

        {isLoading ? (
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-skeleton-grid">
              <div className="dashboard-skeleton dashboard-skeleton-card" />
              <div className="dashboard-skeleton dashboard-skeleton-card" />
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-cleaner-summary">
              <article className="dashboard-kpi-card accent-blue">
                <span className="dashboard-kpi-label">Missing Values</span>
                <strong>
                  {cleaning?.missingValues?.reduce((sum, item) => sum + item.missingCount, 0) || 0}
                </strong>
                <p>Cells requiring attention across all columns</p>
              </article>
              <article className="dashboard-kpi-card accent-purple">
                <span className="dashboard-kpi-label">Duplicate Rows</span>
                <strong>{cleaning?.duplicateRows || 0}</strong>
                <p>Exact repeated rows found in the dataset</p>
              </article>
              <article className="dashboard-kpi-card accent-cyan">
                <span className="dashboard-kpi-label">Numeric Columns</span>
                <strong>{cleaning?.numericColumns?.length || 0}</strong>
                <p>Fields available for mean-based filling</p>
              </article>
            </section>

            <div className="dashboard-grid dashboard-grid-uneven">
              <section className="dashboard-surface dashboard-surface-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="stat-label mb-2">Suggestions</p>
                    <h2>Recommended cleaning operations</h2>
                  </div>
                </div>

                <div className="dashboard-insights-grid">
                  {(cleaning?.suggestions || []).length ? (
                    cleaning.suggestions.map((suggestion, index) => (
                      <label key={`${suggestion.type}-${index}`} className="dashboard-cleaner-card">
                        <div className="dashboard-cleaner-card-top">
                          <input
                            type="checkbox"
                            checked={selectedOperations.includes(suggestion.type)}
                            onChange={() => toggleOperation(suggestion.type)}
                          />
                          <span className="feature-chip">{suggestion.type}</span>
                        </div>
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.description}</p>
                      </label>
                    ))
                  ) : (
                    <div className="dashboard-empty-state dashboard-empty-state-left">
                      <h3>Dataset looks clean</h3>
                      <p>No missing values, duplicates, or text-format issues were detected.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="dashboard-surface dashboard-surface-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="stat-label mb-2">Advanced Actions</p>
                    <h2>Manual cleaning controls</h2>
                  </div>
                </div>

                <div className="dashboard-premium-form dashboard-premium-form-tight">
                  <div className="dataset-controls-grid cleaner-controls-grid">
                    <select
                      className="form-select"
                      value={columnRename.from}
                      onChange={(event) =>
                        setColumnRename((current) => ({ ...current, from: event.target.value }))
                      }
                    >
                      <option value="">Rename column</option>
                      {(dataset?.columnNames || []).map((columnName) => (
                        <option key={columnName} value={columnName}>
                          {columnName}
                        </option>
                      ))}
                    </select>
                    <input
                      className="form-control"
                      placeholder="New column name"
                      value={columnRename.to}
                      onChange={(event) =>
                        setColumnRename((current) => ({ ...current, to: event.target.value }))
                      }
                    />
                    <select
                      className="form-select"
                      value={columnDelete}
                      onChange={(event) => setColumnDelete(event.target.value)}
                    >
                      <option value="">Delete column</option>
                      {(dataset?.columnNames || []).map((columnName) => (
                        <option key={columnName} value={columnName}>
                          {columnName}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={defaultFill.column}
                      onChange={(event) =>
                        setDefaultFill((current) => ({ ...current, column: event.target.value }))
                      }
                    >
                      <option value="">Fill missing with default</option>
                      {(dataset?.columnNames || []).map((columnName) => (
                        <option key={columnName} value={columnName}>
                          {columnName}
                        </option>
                      ))}
                    </select>
                    <input
                      className="form-control"
                      placeholder="Default value"
                      value={defaultFill.value}
                      onChange={(event) =>
                        setDefaultFill((current) => ({ ...current, value: event.target.value }))
                      }
                    />
                  </div>

                  <div className="dashboard-inline-actions">
                    <button
                      type="button"
                      className="btn auth-submit-btn"
                      disabled={isSubmitting || !cleaning?.suggestions?.length}
                      onClick={handleApplyCleaning}
                    >
                      {isSubmitting ? "Applying..." : "Apply cleaning"}
                    </button>
                    <Link to="/dashboard/analyze" className="btn btn-outline-secondary hero-secondary-btn">
                      Back to Analyze
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
