import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspaceSettings } from "../../hooks/useWorkspaceSettings";
import { fetchDatasetRecords, fetchDatasetStats, fetchDatasetSummary, fetchMyDatasets } from "../../services/datasetService";
import { fetchInsights } from "../../services/aiService";

const pieColors = ["#5B7CFF", "#8EDBFF", "#C38BFF", "#7C5CFF", "#3B5BFF", "#B8C2E0"];

const emptySummary = {
  totalDatasets: 0,
  totalRecords: 0,
  recentUploads: 0,
  reportsGenerated: 0,
};

export default function DashboardPage() {
  const { auth } = useAuth();
  const { settings } = useWorkspaceSettings();
  const [summary, setSummary] = useState(emptySummary);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewPagination, setPreviewPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRows: 0,
  });
  const [previewInsights, setPreviewInsights] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDatasetPanelLoading, setIsDatasetPanelLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryResponse, datasetsResponse] = await Promise.all([
          fetchDatasetSummary(auth.token),
          fetchMyDatasets(auth.token),
        ]);

        const nextDatasets = datasetsResponse.datasets || [];

        setSummary(summaryResponse.summary || emptySummary);
        setDatasets(nextDatasets);
        setSelectedDatasetId(nextDatasets[0]?._id || "");
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load dashboard data right now"
          : "Unable to load dashboard data right now";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [auth.token]);

  useEffect(() => {
    const loadSelectedDataset = async () => {
      if (!selectedDatasetId) {
        setSelectedDataset(null);
        setPreviewRows([]);
        setPreviewInsights([]);
        setChartData(null);
        setPreviewPagination({
          page: 1,
          totalPages: 1,
          totalRows: 0,
        });
        setIsDatasetPanelLoading(false);
        return;
      }

      try {
        setIsDatasetPanelLoading(true);
        const datasetMeta = datasets.find((dataset) => dataset._id === selectedDatasetId) || null;
        const [recordsResponse, statsResponse, insightsResponse] = await Promise.all([
          fetchDatasetRecords(auth.token, selectedDatasetId, { page: 1, limit: 8 }),
          fetchDatasetStats(auth.token, selectedDatasetId),
          fetchInsights(auth.token, selectedDatasetId),
        ]);

        setSelectedDataset(datasetMeta);
        setPreviewRows(recordsResponse.rows || []);
        setPreviewPagination(recordsResponse.pagination || {
          page: 1,
          totalPages: 1,
          totalRows: 0,
        });
        setChartData(statsResponse.chartData || null);
        setPreviewInsights((insightsResponse.insights || []).slice(0, 4));
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load selected dataset right now"
          : "Unable to load selected dataset right now";
        setError(message);
      } finally {
        setIsDatasetPanelLoading(false);
      }
    };

    loadSelectedDataset();
  }, [auth.token, datasets, selectedDatasetId]);

  const metricCards = useMemo(
    () => [
      {
        label: "Total Datasets",
        value: summary.totalDatasets || 0,
        caption: "Connected data sources in your workspace",
        accent: "blue",
      },
      {
        label: "Total Records",
        value: summary.totalRecords || 0,
        caption: "Parsed rows available for analysis",
        accent: "cyan",
      },
      {
        label: "Recent Uploads",
        value: summary.recentUploads || 0,
        caption: "Latest datasets added this session",
        accent: "purple",
      },
      {
        label: "Insights Generated",
        value: summary.reportsGenerated || 0,
        caption: "Datasets ready for smart findings",
        accent: "green",
      },
    ],
    [summary]
  );
  const displayName = settings.displayName.trim() || auth?.user?.name || "User";

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <FormAlert message={error} />

        <section className="dashboard-surface dashboard-surface-hero">
          <div>
            <span className="hero-badge">Analytics Command Center</span>
            <h1 className="dashboard-title">Welcome back, {displayName}</h1>
            <p className="dashboard-subtitle">
              Analyze and visualize your data with a workspace designed for cleaner decisions.
            </p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">{summary.totalDatasets || 0} datasets ready</span>
              <span className="dashboard-context-chip">{summary.totalRecords || 0} records parsed</span>
            </div>

            <div className="dashboard-inline-actions">
              <Link to="/dashboard/upload" className="btn hero-primary-btn">
                Upload dataset
              </Link>
              <Link to="/dashboard/analyze" className="btn btn-outline-secondary hero-secondary-btn">
                Open analysis
              </Link>
            </div>
          </div>
        </section>

        <section className="dashboard-kpi-grid">
          {metricCards.map((card) => (
            <article key={card.label} className={`dashboard-kpi-card accent-${card.accent}`}>
              <span className="dashboard-kpi-label">{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.caption}</p>
            </article>
          ))}
        </section>

        <section className="dashboard-grid dashboard-grid-uneven">
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">Charts Panel</p>
                <h2>{selectedDataset ? selectedDataset.datasetName : "Visual overview"}</h2>
              </div>

              <select
                className="form-select dashboard-select"
                value={selectedDatasetId}
                onChange={(event) => setSelectedDatasetId(event.target.value)}
              >
                <option value="">Select dataset</option>
                {datasets.map((dataset) => (
                  <option key={dataset._id} value={dataset._id}>
                    {dataset.datasetName}
                  </option>
                ))}
              </select>
            </div>

            {isLoading || isDatasetPanelLoading ? (
              <div className="dashboard-skeleton-grid">
                <div className="dashboard-skeleton dashboard-skeleton-card" />
                <div className="dashboard-skeleton dashboard-skeleton-card" />
              </div>
            ) : selectedDataset ? (
              <div className="dashboard-chart-grid">
                <article className="chart-card dashboard-chart-card">
                  <div className="dashboard-chart-head">
                    <div>
                      <span className="feature-chip">Bar chart</span>
                      <h3>{selectedDataset.datasetName}</h3>
                    </div>
                  </div>
                  <div className="chart-frame chart-frame-lg">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData?.barLineData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" hide />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#5B7CFF" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="chart-card dashboard-chart-card">
                  <div className="dashboard-chart-head">
                    <div>
                      <span className="feature-chip">Line + Pie</span>
                      <h3>Comparative trends</h3>
                    </div>
                  </div>
                  <div className="dashboard-split-chart">
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={chartData?.barLineData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" hide />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8EDBFF"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={chartData?.pieData || []}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={84}
                            innerRadius={38}
                          >
                            {(chartData?.pieData || []).map((entry, index) => (
                              <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </article>
              </div>
            ) : (
              <div className="dashboard-empty-state dashboard-empty-state-left">
                <h3>No datasets available</h3>
                <p>Upload a dataset to start exploring charts, previews, and AI insights.</p>
              </div>
            )}
          </section>

          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">AI Insights Panel</p>
                <h2>Latest findings</h2>
              </div>
            </div>

            {isLoading || isDatasetPanelLoading ? (
              <div className="dashboard-skeleton-grid">
                <div className="dashboard-skeleton dashboard-skeleton-card" />
                <div className="dashboard-skeleton dashboard-skeleton-card" />
              </div>
            ) : previewInsights.length ? (
              <div className="dashboard-insights-grid">
                {previewInsights.map((insight) => (
                  <article key={insight} className="dashboard-insight-card">
                    <span className="dashboard-insight-dot" />
                    <strong>{insight}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state dashboard-empty-state-left">
                <h3>No insights yet</h3>
                <p>Select a dataset to see rule-based observations and quick summaries.</p>
              </div>
            )}
          </section>
        </section>

        <section className="dashboard-surface dashboard-surface-panel">
          <div className="dashboard-panel-head">
            <div>
              <p className="stat-label mb-2">Dataset Preview Table</p>
              <h2>First rows from your selected dataset</h2>
            </div>
            {selectedDataset ? (
              <Link to={`/dashboard/datasets/${selectedDataset._id}`} className="btn btn-outline-secondary hero-secondary-btn">
                Open full details
              </Link>
            ) : null}
          </div>

          {isLoading || isDatasetPanelLoading ? (
            <div className="dashboard-skeleton dashboard-skeleton-table" />
          ) : selectedDataset ? (
            <div className="table-preview-shell premium-table-shell">
              <div className="table-preview-header">
                <span>{previewPagination.totalRows} total rows</span>
                <span>{selectedDataset.columnNames?.join(" • ")}</span>
              </div>
              <div className="table-responsive dataset-table-wrap">
                <table className="table dataset-table">
                  <thead>
                    <tr>
                      {(selectedDataset.columnNames || []).map((columnName) => (
                        <th key={columnName}>{columnName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                        {(selectedDataset.columnNames || []).map((columnName) => (
                          <td key={`${rowIndex}-${columnName}`}>{String(row[columnName] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-state dashboard-empty-state-left">
              <h3>No preview available</h3>
              <p>Once you upload a dataset, the preview table will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
