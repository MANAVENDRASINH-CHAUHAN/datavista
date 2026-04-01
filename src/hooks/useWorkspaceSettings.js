import { useContext } from "react";

import { WorkspaceSettingsContext } from "../context/WorkspaceSettingsContext";

export const useWorkspaceSettings = () => useContext(WorkspaceSettingsContext);
