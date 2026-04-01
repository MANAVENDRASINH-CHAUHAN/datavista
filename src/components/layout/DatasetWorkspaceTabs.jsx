import { NavLink } from "react-router-dom";

export default function DatasetWorkspaceTabs({ datasetId }) {
  return (
    <nav className="dataset-workspace-tabs" aria-label="Dataset workspace">
      <NavLink
        to={`/dashboard/datasets/${datasetId}`}
        end
        className={({ isActive }) =>
          `dataset-workspace-tab ${isActive ? "is-active" : ""}`
        }
      >
        Details
      </NavLink>
      <NavLink
        to={`/dashboard/datasets/${datasetId}/cleaner`}
        className={({ isActive }) =>
          `dataset-workspace-tab ${isActive ? "is-active" : ""}`
        }
      >
        Cleaner
      </NavLink>
      <NavLink
        to={`/dashboard/datasets/${datasetId}/insights`}
        className={({ isActive }) =>
          `dataset-workspace-tab ${isActive ? "is-active" : ""}`
        }
      >
        Insights
      </NavLink>
    </nav>
  );
}
