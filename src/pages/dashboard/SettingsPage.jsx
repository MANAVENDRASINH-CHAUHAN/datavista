import { useState } from "react";

import FormAlert from "../../components/common/FormAlert";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspaceSettings } from "../../hooks/useWorkspaceSettings";

export default function SettingsPage() {
  const { auth } = useAuth();
  const { settings, updateSettings, resetSettings } = useWorkspaceSettings();
  const [displayNameInput, setDisplayNameInput] = useState(
    () => settings.displayName || auth?.user?.name || ""
  );
  const [statusMessage, setStatusMessage] = useState("");
  const displayName = settings.displayName.trim() || auth?.user?.name || "DataVista User";

  const handleSaveDisplayName = (event) => {
    event.preventDefault();
    const nextDisplayName = displayNameInput.trim();

    updateSettings({ displayName: nextDisplayName });
    setStatusMessage(
      nextDisplayName
        ? "Display name saved for this browser."
        : "Display name cleared. Your account name will be shown instead."
    );
  };

  const handleToggle = (settingKey, enabledMessage, disabledMessage) => {
    const nextValue = !settings[settingKey];

    updateSettings({ [settingKey]: nextValue });
    setStatusMessage(nextValue ? enabledMessage : disabledMessage);
  };

  const handleResetSettings = () => {
    resetSettings();
    setDisplayNameInput(auth?.user?.name || "");
    setStatusMessage("Workspace settings reset to default.");
  };

  return (
    <section className="dashboard-screen dashboard-premium-screen">
      <div className="dashboard-page-stack">
        <FormAlert type="success" message={statusMessage} />

        <section className="dashboard-surface dashboard-surface-hero">
          <div>
            <span className="hero-badge">Settings</span>
            <h1 className="dashboard-title">Workspace preferences</h1>
            <p className="dashboard-subtitle">
              Manage your profile details and a few simple dashboard preferences for this browser.
            </p>
            <div className="dashboard-chip-row">
              <span className="dashboard-context-chip">{auth?.user?.role || "member"} role</span>
              <span className="dashboard-context-chip">
                {settings.compactSidebar ? "Compact sidebar" : "Standard sidebar"}
              </span>
              <span className="dashboard-context-chip">
                {settings.reduceMotion ? "Reduced motion" : "Smooth motion"}
              </span>
            </div>
          </div>
        </section>

        <div className="dashboard-grid dashboard-grid-uneven">
          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">Profile</p>
                <h2>Signed-in user</h2>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-avatar">
                {displayName.slice(0, 1).toUpperCase() || "D"}
              </div>
              <div className="settings-copy">
                <strong>{displayName}</strong>
                <p>{auth?.user?.email}</p>
                <span className="feature-chip">{auth?.user?.role || "member"}</span>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveDisplayName}>
              <label className="settings-field">
                <span>Workspace display name</span>
                <input
                  type="text"
                  className="form-control"
                  value={displayNameInput}
                  onChange={(event) => setDisplayNameInput(event.target.value)}
                  placeholder="Enter the name to show in the dashboard"
                />
                <small>This name appears in the dashboard header and welcome section.</small>
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="btn nav-primary-btn">
                  Save name
                </button>
                <button
                  type="button"
                  className="btn nav-ghost-btn"
                  onClick={() => {
                    setDisplayNameInput("");
                    updateSettings({ displayName: "" });
                    setStatusMessage("Display name cleared. Your account name will be shown instead.");
                  }}
                >
                  Use account name
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-surface dashboard-surface-panel">
            <div className="dashboard-panel-head">
              <div>
                <p className="stat-label mb-2">Workspace</p>
                <h2>Basic preferences</h2>
              </div>
            </div>

            <div className="settings-option-list">
              <article className="settings-option">
                <div>
                  <strong>Compact sidebar</strong>
                  <p>Make the left navigation slimmer while keeping every menu item readable.</p>
                </div>
                <button
                  type="button"
                  className={`btn ${settings.compactSidebar ? "nav-primary-btn" : "nav-ghost-btn"} settings-toggle-btn`}
                  onClick={() =>
                    handleToggle(
                      "compactSidebar",
                      "Compact sidebar enabled.",
                      "Standard sidebar restored."
                    )
                  }
                >
                  {settings.compactSidebar ? "Enabled" : "Disabled"}
                </button>
              </article>

              <article className="settings-option">
                <div>
                  <strong>Reduced motion</strong>
                  <p>Turn down interface motion for a calmer, more static dashboard experience.</p>
                </div>
                <button
                  type="button"
                  className={`btn ${settings.reduceMotion ? "nav-primary-btn" : "nav-ghost-btn"} settings-toggle-btn`}
                  onClick={() =>
                    handleToggle(
                      "reduceMotion",
                      "Reduced motion enabled.",
                      "Smooth motion restored."
                    )
                  }
                >
                  {settings.reduceMotion ? "Enabled" : "Disabled"}
                </button>
              </article>

              <article className="settings-option">
                <div>
                  <strong>Sidebar helper note</strong>
                  <p>Show or hide the quick helper card at the bottom of the sidebar.</p>
                </div>
                <button
                  type="button"
                  className={`btn ${settings.showSidebarNote ? "nav-primary-btn" : "nav-ghost-btn"} settings-toggle-btn`}
                  onClick={() =>
                    handleToggle(
                      "showSidebarNote",
                      "Sidebar helper note shown.",
                      "Sidebar helper note hidden."
                    )
                  }
                >
                  {settings.showSidebarNote ? "Visible" : "Hidden"}
                </button>
              </article>
            </div>

            <div className="settings-reset-card">
              <div>
                <strong>Reset preferences</strong>
                <p>Clear all local settings and go back to the default dashboard behavior.</p>
              </div>
              <button type="button" className="btn nav-ghost-btn" onClick={handleResetSettings}>
                Reset all
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
