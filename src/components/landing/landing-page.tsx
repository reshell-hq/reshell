import Image from "next/image";
import Link from "next/link";
import { ReshellLogo } from "@/components/branding/reshell-logo";
import {
  getLandingPageContent,
  type LandingPageContent,
} from "@/landing/landing-page";

type LandingPageProps = {
  content?: LandingPageContent;
};

export function LandingPage({ content = getLandingPageContent() }: LandingPageProps) {
  const {
    productName,
    headline,
    tagline,
    supportingStatement,
    features,
    setupTitle,
    setupDescription,
    setupLinks,
    heroImageSrc,
    heroImageAlt,
    homeStationHref,
    homeStationCta,
    startPageHref,
    startPageCta,
    waitlistHref,
    waitlistCta,
    earlyAccessNote,
    footerLinks,
    footerLocalTierNote,
  } = getLandingPageContent();

  return (
    <main className="landing-page">
      <div className="landing-page-inner">
        <header className="landing-page-header">
          <ReshellLogo size={28} lockup plain label={productName} className="landing-page-brand" />
          <h1 className="landing-page-headline">{headline}</h1>
          <p className="landing-page-tagline">{tagline}</p>
          <p className="landing-page-supporting">{supportingStatement}</p>

          <div className="landing-page-actions">
            <Link href={homeStationHref} className="landing-page-cta landing-page-cta--primary">
              {homeStationCta}
            </Link>
            {waitlistHref ? (
              <a
                href={waitlistHref}
                className="landing-page-cta landing-page-cta--secondary"
                rel="noopener noreferrer"
                target="_blank"
              >
                {waitlistCta}
              </a>
            ) : null}
            <Link href={startPageHref} className="landing-page-cta landing-page-cta--ghost">
              {startPageCta}
            </Link>
          </div>

          <p className="landing-page-note">{earlyAccessNote}</p>
        </header>

        <figure className="landing-page-hero">
          <Image
            src={heroImageSrc}
            alt={heroImageAlt}
            width={1512}
            height={982}
            priority
            className="landing-page-hero-image"
          />
        </figure>

        <section className="landing-page-features" aria-label="Features">
          <ul className="landing-page-feature-list">
            {features.map((feature) => (
              <li key={feature.title} className="landing-page-feature">
                <h2 className="landing-page-feature-title">{feature.title}</h2>
                <p className="landing-page-feature-copy">{feature.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-page-setup" aria-label="Setup">
          <h2 className="landing-page-setup-title">{setupTitle}</h2>
          <p className="landing-page-setup-copy">{setupDescription}</p>
          <nav className="landing-page-setup-links" aria-label="Setup resources">
            {setupLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="landing-page-setup-link"
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </section>

        <footer className="landing-page-footer">
          <p className="landing-page-footer-note">{footerLocalTierNote}</p>
          <nav className="landing-page-footer-links" aria-label="Project links">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="landing-page-footer-link"
                rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
                target={link.href.startsWith("/") ? undefined : "_blank"}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </main>
  );
}
