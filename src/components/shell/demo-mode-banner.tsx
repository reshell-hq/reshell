"use client";

const DEMO_FORK_REPO_HREF = "https://github.com/reshell-hq/reshell";

export function DemoModeBanner() {
  return (
    <div className="shell-demo-banner" role="status">
      <p className="shell-demo-banner-copy">
        This is a live demo —{" "}
        <a
          href={DEMO_FORK_REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="shell-demo-banner-link"
        >
          fork &amp; deploy
        </a>{" "}
        to make it yours.
      </p>
    </div>
  );
}
