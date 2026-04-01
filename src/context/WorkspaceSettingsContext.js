import { createContext } from "react";

export const WorkspaceSettingsContext = createContext({
  settings: {
    displayName: "",
    compactSidebar: false,
    reduceMotion: false,
    showSidebarNote: true,
  },
  updateSettings: () => {},
  resetSettings: () => {},
});
