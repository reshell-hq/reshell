import { createRegistry } from "./registry";

/**
 * An extra command-bar action contributed by a paid edition (e.g. the Pro
 * `:plan` agent action). Empty in the OSS build. `id` becomes the action's
 * `actionId`; `run` is invoked when the user selects it from the command bar.
 */
export type ExtraCommandBarAction = {
  id: string;
  label: string;
  run: () => void;
};

export const commandBarActionRegistry = createRegistry<ExtraCommandBarAction>();
