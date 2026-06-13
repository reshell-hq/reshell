import { LandingPage } from "@/components/landing/landing-page";
import { getLandingPageMetadata } from "@/landing/landing-metadata";

export const metadata = getLandingPageMetadata();

export default function LandingRoute() {
  return <LandingPage />;
}
