import type { ComponentType, HTMLAttributes } from "react";
import {
  BellIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChromeIcon,
  CircleCheckIcon,
  ClipboardIcon,
  CodeIcon,
  CoffeeIcon,
  CompassIcon,
  DollarSignIcon,
  FigmaIcon,
  FlameIcon,
  FolderIcon,
  GitBranchIcon,
  GithubIcon,
  GitlabIcon,
  GlobeIcon,
  HeadphonesIcon,
  HeartIcon,
  HouseIcon,
  LayoutGridIcon,
  LayoutListIcon,
  LinkIcon,
  LinkedinIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  MoonIcon,
  PhoneIcon,
  PlayIcon,
  RocketIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TelescopeIcon,
  TerminalIcon,
  TwitterIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
} from "@animateicons/react/lucide";
import type { IconName } from "./names";

/**
 * The curated default icon set (plan 015). Each name maps to one
 * `@animateicons/react/lucide` component via a **direct named import** — never a
 * barrel — so the bundler tree-shakes to only the glyphs used here, not all
 * ~248 in the pack. Adding a default = one import + one entry + one `IconName`
 * member (in `./names`); the `satisfies Record<IconName, …>` keeps the two in
 * lockstep at compile time.
 *
 * Import-only (ADR-0009); `<Icon>` is the single render path that turns a
 * resolved `{ kind: "named" }` into one of these.
 */

/** The shared shape of a pack icon component (size, color, hover animation). */
export type AnimatedIconProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "color" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  size?: number;
  duration?: number;
  isAnimated?: boolean;
  color?: string;
};

export type AnimatedIconComponent = ComponentType<AnimatedIconProps>;

export const iconByName = {
  github: GithubIcon,
  gitlab: GitlabIcon,
  "git-branch": GitBranchIcon,
  code: CodeIcon,
  terminal: TerminalIcon,
  figma: FigmaIcon,
  chrome: ChromeIcon,
  globe: GlobeIcon,
  mail: MailIcon,
  send: SendIcon,
  message: MessageCircleIcon,
  phone: PhoneIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  book: BookOpenIcon,
  headphones: HeadphonesIcon,
  play: PlayIcon,
  star: StarIcon,
  heart: HeartIcon,
  sparkles: SparklesIcon,
  bell: BellIcon,
  home: HouseIcon,
  folder: FolderIcon,
  bookmark: BookmarkIcon,
  link: LinkIcon,
  search: SearchIcon,
  compass: CompassIcon,
  "map-pin": MapPinIcon,
  grid: LayoutGridIcon,
  list: LayoutListIcon,
  settings: SettingsIcon,
  clipboard: ClipboardIcon,
  check: CircleCheckIcon,
  cart: ShoppingCartIcon,
  wallet: WalletIcon,
  dollar: DollarSignIcon,
  rocket: RocketIcon,
  flame: FlameIcon,
  zap: ZapIcon,
  sun: SunIcon,
  moon: MoonIcon,
  coffee: CoffeeIcon,
  telescope: TelescopeIcon,
  lock: LockIcon,
  user: UserIcon,
  users: UsersIcon,
} satisfies Record<IconName, AnimatedIconComponent>;
