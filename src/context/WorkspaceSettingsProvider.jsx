import { useEffect, useMemo, useState } from "react";

import { WorkspaceSettingsContext } from "./WorkspaceSettingsContext";

const WORKSPACE_SETTINGS_KEY = "datavista_workspace_settings";

const defaultSettings = {
  displayName: "",
  compactSidebar: false,
  reduceMotion: false,
  showSidebarNote: true,
};

const readStoredSettings = () => {
  const rawSettings = localStorage.getItem(WORKSPACE_SETTINGS_KEY);

  if (!rawSettings) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...JSON.parse(rawSettings),
    };
  } catch {
    localStorage.removeItem(WORKSPACE_SETTINGS_KEY);
    return defaultSettings;
  }
};

const writeStoredSettings = (settings) => {
  localStorage.setItem(WORKSPACE_SETTINGS_KEY, JSON.stringify(settings));
};

export function WorkspaceSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readStoredSettings());

  useEffect(() => {
    writeStoredSettings(settings);
    document.documentElement.classList.toggle("workspace-reduced-motion", settings.reduceMotion);
  }, [settings]);

  const updateSettings = (nextSettings) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
    }),
    [settings]
  );

  return (
    <WorkspaceSettingsContext.Provider value={value}>
      {children}
    </WorkspaceSettingsContext.Provider>
  );
}
