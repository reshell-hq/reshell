/**
 * Shell primitive barrel: the public, React-free types a consumer needs to
 * theme `<Shell>` or type its edges. The geometry/animation helpers stay
 * internal to `components/shell/` (imported by path); only the contract types
 * are part of the import surface (ADR-0009).
 */
export type { ShellEdge } from "./types";
export type {
  ShellHandleComponent,
  ShellHandleRenderProps,
  ShellTheme,
  ShellThemeInput,
} from "./theme";
