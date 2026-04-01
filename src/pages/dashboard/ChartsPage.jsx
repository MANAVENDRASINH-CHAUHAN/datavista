import { useEffect, useState } from "react";
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
import { fetchDatasetStats, fetchMyDatasets } from "../../services/datasetService";

const pieColors = ["#5B7CFF", "#8EDBFF", "#C38BFF", "#7C5CFF", "#3B5BFF", "#B8C2E0"];

const axisTickStyle = {
  fill: "#B8C2E0",
  fontSize: 12,
  fontWeight: 600,
};

const gridStroke = "rgba(184, 194, 224, 0.14)";

const formatAxisLabel = (value) => {
  const label = String(value ?? "");
  return label.length > 12 ? `${label.slice(0, 12)}…` : label;
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const title = label || payload[0]?.payload?.name || "Value";

  return (
    <div className="chart-tooltip">
      <strong>{title}</strong>
      <span>{payload[0].value}</span>
    </div>
  );
}

export default function ChartsPage() {
  const { auth } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [axes, setAxes] = useState({ xAxis: "", yAxis: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selectedDataset = datasets.find((dataset) => dataset._id === selectedDatasetId) || null;

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetchMyDatasets(auth.token);
        const nextDatasets = response.datasets || [];
        setDatasets(nextDatasets);
        setSelectedDatasetId(nextDatasets[0]?._id || "");
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load chart datasets right now"
          : "Unable to load chart datasets right now";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, [auth.token]);

  useEffect(() => {
    const loadChartData = async () => {
      if (!selectedDatasetId) {
        setStats(null);
        setChartData(null);
        return;
      }

      try {
        const response = await fetchDatasetStats(auth.token, selectedDatasetId, axes);
        setStats(response.stats);
        setChartData(response.chartData);
        setAxes({
          xAxis: response.chartData?.xAxis || "",
          yAxis: response.chartData?.yAxis || "",
        });
        setError("");
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load charts right now"
          : "Unable to load charts right now";
        setError(message);
      }
    };

    loadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, selectedDatasetId]);

  const handleAxisChange = async (event) => {
    const { name, value } = event.target;
    const nextAxes = { ...axes, [name]: value };
    setAxes(nextAxes);

    if (!selectedDatasetId) {
      return;
    }

    try {
      const response = await fetchDatasetStats(auth.token, selectedDatasetId, nextAxes);
      setStats(response.stats);
      setChartData(response.chartData);
      setError("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Unable to update charts right now"
        : "Unable to update charts right now";
      setError(message);
    }
  };

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <section className="dashboard-surface dashboard-surface-hero">
          <div>
            <span className="hero-badge">Charts Lab</span>
            <h1 className="dashboard-title">Visualize your datasets</h1>
            <p className="dashboard-subtitle">
              Build chart previews by selecting a dataset and choosing the right axes.
            </p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">
                {selectedDataset?.datasetName || "Select a dataset"}
              </span>
              <span className="dashboard-context-chip">Bar, line, and pie ready</span>
            </div>
          </div>

          <div className="dashboard-surface-actions">
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
        </section>

        <FormAlert message={error} />

        {isLoading ? (
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-skeleton dashboard-skeleton-hero" />
          </section>
        ) : !datasets.length ? (
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-empty-state dashboard-empty-state-left">
              <h3>No datasets available</h3>
              <p>Upload a dataset first to start generating charts.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-surface dashboard-surface-panel">
              <div className="dashboard-panel-head">
                <div>
                  <p className="stat-label mb-2">Chart Controls</p>
                  <h2>Choose how your data should be visualized</h2>
                </div>
              </div>

              <div className="charts-toolbar">
                <select
                  name="xAxis"
                  className="form-select dashboard-select"
                  value={axes.xAxis}
                  onChange={handleAxisChange}
                >
                  <option value="">X-axis</option>
                  {(stats?.columnProfiles || []).map((item) => (
                    <option key={item.column} value={item.column}>
                      {item.column}
                    </option>
                  ))}
                </select>
                <select
                  name="yAxis"
                  className="form-select dashboard-select"
                  value={axes.yAxis}
                  onChange={handleAxisChange}
                >
                  <option value="">Y-axis</option>
                  {(stats?.numericColumns || []).map((columnName) => (
                    <option key={columnName} value={columnName}>
                      {columnName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard-chart-grid">
                <article className="chart-card dashboard-chart-card">
                  <div className="dashboard-chart-head">
                    <div>
                      <span className="feature-chip">Bar</span>
                      <h3>Distribution</h3>
                    </div>
                  </div>
                  <div className="chart-frame chart-frame-lg">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData?.barLineData || []}>
                        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={axisTickStyle}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          height={52}
                          tickFormatter={formatAxisLabel}
                        />
                        <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} width={42} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(34, 211, 238, 0.06)" }} />
                        <Bar dataKey="value" fill="#5B7CFF" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="chart-card dashboard-chart-card">
                  <div className="dashboard-chart-head">
                    <div>
                      <span className="feature-chip">Line</span>
                      <h3>Trend</h3>
                    </div>
                  </div>
                  <div className="chart-frame chart-frame-lg">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData?.barLineData || []}>
                        <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={axisTickStyle}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          height={52}
                          tickFormatter={formatAxisLabel}
                        />
                        <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} width={42} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(34, 211, 238, 0.2)" }} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8EDBFF"
                          strokeWidth={3}
                          dot={{ r: 3, fill: "#8EDBFF", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#C38BFF" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="chart-card dashboard-chart-card">
                  <div className="dashboard-chart-head">
                    <div>
                      <span className="feature-chip">Pie</span>
                      <h3>Composition</h3>
                    </div>
                  </div>
                  <div className="chart-frame chart-frame-lg">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={chartData?.pieData || []}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={88}
                          innerRadius={50}
                          paddingAngle={3}
                        >
                          {(chartData?.pieData || []).map((entry, index) => (
                            <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          align="center"
                          iconType="circle"
                          formatter={(value) => formatAxisLabel(value)}
                          wrapperStyle={{ color: "#B8C2E0", fontSize: "12px", paddingTop: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}
