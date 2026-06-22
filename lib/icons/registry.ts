import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  CircleCheck,
  Clipboard,
  Code,
  Coffee,
  Compass,
  AppWindow,
  Bird,
  DollarSign,
  Flame,
  FolderGit2,
  Folder,
  GitBranch,
  GitFork,
  Globe,
  Headphones,
  Heart,
  House,
  LayoutGrid,
  LayoutList,
  Link,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  PenTool,
  Phone,
  Play,
  Rocket,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Sun,
  Telescope,
  Terminal,
  User,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./names";

/**
 * The curated default icon set (plan 015). Each name maps to one `lucide-react`
 * component via a **direct named import** — never a barrel/dynamic map — so the
 * bundler tree-shakes to only the glyphs used here (lucide-react ships per-icon
 * modules and is in Next's default `optimizePackageImports`). Adding a default =
 * one import + one entry + one `IconName` member (in `./names`); the
 * `satisfies Record<IconName, …>` keeps the two in lockstep at compile time.
 *
 * Import-only (ADR-0009); `<Icon>` is the single render path that turns a
 * resolved `{ kind: "named" }` into one of these.
 *
 * Brand glyphs (github/gitlab/figma/chrome/twitter/linkedin) were removed from
 * lucide v1, so those keys map to the closest non-brand lucide icon (see the
 * inline notes). The public name set is unchanged, so config authoring is too.
 */
export type AnimatedIconComponent = LucideIcon;

export const iconByName = {
  github: FolderGit2, // brand removed in lucide v1 → git-repo folder
  gitlab: GitFork, // brand removed → fork/MR flavour (distinct from git-branch)
  "git-branch": GitBranch,
  code: Code,
  terminal: Terminal,
  figma: PenTool, // brand removed → vector/design tool
  chrome: AppWindow, // brand removed → browser window
  globe: Globe,
  mail: Mail,
  send: Send,
  message: MessageCircle,
  phone: Phone,
  twitter: Bird, // brand removed → bird
  linkedin: Briefcase, // brand removed → professional network
  book: BookOpen,
  headphones: Headphones,
  play: Play,
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
  bell: Bell,
  home: House,
  folder: Folder,
  bookmark: Bookmark,
  link: Link,
  search: Search,
  compass: Compass,
  "map-pin": MapPin,
  grid: LayoutGrid,
  list: LayoutList,
  settings: Settings,
  clipboard: Clipboard,
  check: CircleCheck,
  cart: ShoppingCart,
  wallet: Wallet,
  dollar: DollarSign,
  rocket: Rocket,
  flame: Flame,
  zap: Zap,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  telescope: Telescope,
  lock: Lock,
  user: User,
  users: Users,
} satisfies Record<IconName, AnimatedIconComponent>;
