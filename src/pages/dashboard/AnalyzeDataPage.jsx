import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import { fetchMyDatasets } from "../../services/datasetService";

const toolCopy = {
  cleaner: {
    badge: "Data Cleaner",
    title: "Prepare your datasets for analysis",
    description: "Open a dataset and apply missing-value, duplicate, and formatting fixes.",
  },
  insights: {
    badge: "AI Insights",
    title: "Generate readable findings from data",
    description: "Open a dataset and review automated summaries, trends, and smart observations.",
  },
  default: {
    badge: "Analyze Data",
    title: "Choose a dataset to explore",
    description: "Move from raw upload to cleaner, insights, charts, and detailed exploration.",
  },
};

export default function AnalyzeDataPage() {
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const activeTool = searchParams.get("tool") || "default";
  const heroContent = toolCopy[activeTool] || toolCopy.default;

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

  const summary = useMemo(
    () => ({
      datasets: datasets.length,
      rows: datasets.reduce((sum, dataset) => sum + Number(dataset.rowCount || 0), 0),
    }),
    [datasets]
  );

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero">
          <div>
            <span className="hero-badge">{heroContent.badge}</span>
            <h1 className="dashboard-title">{heroContent.title}</h1>
            <p className="dashboard-subtitle">{heroContent.description}</p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">{summary.datasets} datasets ready</span>
              <span className="dashboard-context-chip">{summary.rows} parsed rows</span>
            </div>
          </div>
        </section>

        <FormAlert message={error} />

        <section className="dashboard-kpi-grid dashboard-kpi-grid-compact">
          <article className="dashboard-kpi-card accent-blue">
            <span className="dashboard-kpi-label">Datasets</span>
            <strong>{summary.datasets}</strong>
            <p>Available for analysis</p>
          </article>
          <article className="dashboard-kpi-card accent-cyan">
            <span className="dashboard-kpi-label">Rows</span>
            <strong>{summary.rows}</strong>
            <p>Parsed into the workspace</p>
          </article>
        </section>

        <section className="dashboard-surface dashboard-surface-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="stat-label mb-2">Analysis Workspace</p>
              <h2>Dataset workbench</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="dashboard-skeleton-grid">
              <div className="dashboard-skeleton dashboard-skeleton-card" />
              <div className="dashboard-skeleton dashboard-skeleton-card" />
            </div>
          ) : datasets.length ? (
            <div className="dashboard-library-grid">
              {datasets.map((dataset) => (
                <article key={dataset._id} className="dashboard-workbench-card">
                  <div className="dashboard-library-head">
                    <span className="feature-chip">{dataset.category || "General"}</span>
                    <span className="dataset-date">{dataset.rowCount || 0} rows</span>
                  </div>

                  <div className="dashboard-library-copy">
                    <h3>{dataset.datasetName}</h3>
                    <p>{dataset.description || "Open this dataset to clean values, inspect structure, and generate charts."}</p>
                  </div>

                  <div className="dashboard-library-stats">
                    <span>{dataset.columnCount || 0} columns</span>
                    <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="dashboard-workbench-actions">
                    <Link to={`/dashboard/datasets/${dataset._id}/cleaner`} className="btn btn-outline-secondary hero-secondary-btn">
                      Cleaner
                    </Link>
                    <Link to={`/dashboard/datasets/${dataset._id}/insights`} className="btn hero-primary-btn">
                      Insights
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state dashboard-empty-state-left">
              <h3>No datasets available yet</h3>
              <p>Upload a dataset first, then return here to open Details, Cleaner, and Insights.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
