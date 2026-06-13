"use client";

import { useState } from "react";
import { getStartPageSettingsContent } from "@/start/start-page-settings";

export function ShellConfigStartPage() {
  const content = getStartPageSettingsContent();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const absoluteUrl = new URL(content.bookmarkPath, window.location.origin).href;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="shell-config-section">
      <p className="shell-config-form-label">Start page</p>
      <p className="shell-config-dialog-copy">{content.helperText}</p>

      <div className="shell-config-form">
        <p className="shell-config-form-label">{content.bookmarkLabel}</p>
        <input type="text" readOnly value={content.bookmarkPath} className="shell-config-input" />
        <div className="shell-config-form-actions shell-config-form-actions-start">
          <button type="button" className="shell-config-submit" onClick={() => void handleCopy()}>
            {copied ? "Copied" : content.copyButtonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
