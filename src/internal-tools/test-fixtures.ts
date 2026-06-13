import { createDefaultWorkspaceInternalTools } from "./pomodoro";

export { createDefaultWorkspaceInternalTools };

export function defaultInternalToolsForTests() {
  return createDefaultWorkspaceInternalTools();
}
