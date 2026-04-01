import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchDatasetDetails,
  fetchDatasetRecords,
  fetchDatasetStats,
} from "../../services/datasetService";
import DatasetWorkspaceTabs from "../../components/layout/DatasetWorkspaceTabs";

const pieColors = ["#5B7CFF", "#8EDBFF", "#C38BFF", "#7C5CFF", "#3B5BFF", "#B8C2E0"];

const initialFilters = {
  search: "",
  filterColumn: "",
  filterOperator: "contains",
  filterValue: "",
  sortBy: "",
  sortOrder: "asc",
};

export default function DatasetDetailsPage() {
  const { datasetId } = useParams();
  const { auth } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRows: 0,
    totalPages: 1,
  });
  const [chartAxes, setChartAxes] = useState({
    xAxis: "",
    yAxis: "",
  });
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const columnNames = dataset?.columnNames || [];

  const loadDatasetPage = async (page = 1, nextFilters = filters, nextAxes = chartAxes) => {
    try {
      const [detailsResponse, recordsResponse, statsResponse] = await Promise.all([
        fetchDatasetDetails(auth.token, datasetId),
        fetchDatasetRecords(auth.token, datasetId, {
          page,
          limit: 10,
          ...nextFilters,
        }),
        fetchDatasetStats(auth.token, datasetId, {
          xAxis: nextAxes.xAxis,
          yAxis: nextAxes.yAxis,
        }),
      ]);

      setDataset(detailsResponse.dataset);
      setStats(statsResponse.stats);
      setChartData(statsResponse.chartData);
      setChartAxes({
        xAxis: statsResponse.chartData?.xAxis || "",
        yAxis: statsResponse.chartData?.yAxis || "",
      });
      setRows(recordsResponse.rows || []);
      setPagination(recordsResponse.pagination);
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to load dataset details right now"
        : "Unable to load dataset details right now";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, auth.token]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await loadDatasetPage(1, filters);
  };

  const handlePageChange = async (nextPage) => {
    await loadDatasetPage(nextPage, filters);
  };

  const handleAxisChange = async (event) => {
    const { name, value } = event.target;
    const nextAxes = { ...chartAxes, [name]: value };
    setChartAxes(nextAxes);
    await loadDatasetPage(pagination.page, filters, nextAxes);
  };

  const summaryCards = useMemo(
    () => [
      { label: "Total Rows", value: dataset?.rowCount ?? 0 },
      { label: "Total Columns", value: dataset?.columnCount ?? 0 },
      { label: "Preview Rows", value: rows.length },
      { label: "Numeric Columns", value: stats?.numericColumns?.length ?? 0 },
    ],
    [dataset, rows.length, stats]
  );

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero dashboard-surface-hero-grid">
          <div>
            <span className="hero-badge">Dataset Details</span>
            <h1 className="dashboard-title">{dataset?.datasetName || "Dataset"}</h1>
            <p className="dashboard-subtitle">
              Preview records, charts, AI insights, and data quality from one page.
            </p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">{dataset?.rowCount ?? 0} rows</span>
              <span className="dashboard-context-chip">{dataset?.columnCount ?? 0} columns</span>
            </div>
          </div>
          <div className="dashboard-hero-actions">
            <Link to="/dashboard/datasets" className="btn btn-outline-secondary hero-secondary-btn">
              Back
            </Link>
          </div>
        </section>

        <DatasetWorkspaceTabs datasetId={datasetId} />

        <FormAlert message={error} />

        {isLoading ? (
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-empty-state">
              <p className="mb-0">Loading dataset details...</p>
            </div>
          </section>
        ) : (
          <>
            <div className="dashboard-summary-grid">
              {summaryCards.map((card) => (
                <article key={card.label} className="dashboard-kpi-card dashboard-kpi-card-compact accent-blue">
                  <span className="feature-chip">{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>Live values from your uploaded dataset.</p>
                </article>
              ))}
            </div>

            <div className="dashboard-grid">
              <section className="dashboard-surface dashboard-surface-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="stat-label mb-2">Dataset Preview</p>
                    <h2>Search, filter, sort, and preview rows</h2>
                  </div>
                </div>

                <form className="dataset-controls-grid" onSubmit={handleApplyFilters}>
                  <input
                    name="search"
                    className="form-control"
                    placeholder="Search any column"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />

                  <select
                    name="filterColumn"
                    className="form-select"
                    value={filters.filterColumn}
                    onChange={handleFilterChange}
                  >
                    <option value="">Filter column</option>
                    {columnNames.map((columnName) => (
                      <option key={columnName} value={columnName}>
                        {columnName}
                      </option>
                    ))}
                  </select>

                  <select
                    name="filterOperator"
                    className="form-select"
                    value={filters.filterOperator}
                    onChange={handleFilterChange}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="gt">Greater than</option>
                    <option value="gte">Greater than or equal</option>
                    <option value="lt">Less than</option>
                    <option value="lte">Less than or equal</option>
                    <option value="isEmpty">Is empty</option>
                    <option value="isNotEmpty">Is not empty</option>
                  </select>

                  <input
                    name="filterValue"
                    className="form-control"
                    placeholder="Filter value"
                    value={filters.filterValue}
                    onChange={handleFilterChange}
                  />

                  <select
                    name="sortBy"
                    className="form-select"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                  >
                    <option value="">Sort by</option>
                    {columnNames.map((columnName) => (
                      <option key={columnName} value={columnName}>
                        {columnName}
                      </option>
                    ))}
                  </select>

                  <select
                    name="sortOrder"
                    className="form-select"
                    value={filters.sortOrder}
                    onChange={handleFilterChange}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>

                  <button type="submit" className="btn auth-submit-btn">
                    Apply
                  </button>
                </form>

                <div className="table-preview-shell">
                  <div className="table-preview-header">
                    <span>{pagination.totalRows} matching rows</span>
                    <span>{columnNames.join(", ")}</span>
                  </div>
                  <div className="table-responsive dataset-table-wrap">
                    <table className="table dataset-table">
                      <thead>
                        <tr>
                          {columnNames.map((columnName) => (
                            <th key={columnName}>{columnName}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length ? (
                          rows.map((row, rowIndex) => (
                            <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                              {columnNames.map((columnName) => (
                                <td key={`${rowIndex}-${columnName}`}>
                                  {String(row[columnName] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={Math.max(columnNames.length, 1)} className="text-center py-4">
                              No rows match the current query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dataset-pagination">
                  <button
                    type="button"
                    className="btn btn-outline-secondary nav-ghost-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary nav-ghost-btn"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </section>

              <section className="dashboard-surface dashboard-surface-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <p className="stat-label mb-2">Charts Preview</p>
                    <h2>Visualize selected dataset values</h2>
                  </div>
                </div>

                <div className="charts-stack">
                  <div className="dataset-controls-grid chart-controls-grid">
                    <select
                      name="xAxis"
                      className="form-select"
                      value={chartAxes.xAxis}
                      onChange={handleAxisChange}
                    >
                      <option value="">X-axis</option>
                      {columnNames.map((columnName) => (
                        <option key={columnName} value={columnName}>
                          {columnName}
                        </option>
                      ))}
                    </select>

                    <select
                      name="yAxis"
                      className="form-select"
                      value={chartAxes.yAxis}
                      onChange={handleAxisChange}
                    >
                      <option value="">Y-axis</option>
                      {(stats?.numericColumns || columnNames).map((columnName) => (
                        <option key={columnName} value={columnName}>
                          {columnName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="chart-card">
                    <h3>Bar Chart</h3>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData?.barLineData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" hide />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#5B7CFF" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3>Line Chart</h3>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={chartData?.barLineData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" hide />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#8EDBFF" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3>Pie Chart</h3>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={chartData?.pieData || []}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={88}
                            innerRadius={42}
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
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
