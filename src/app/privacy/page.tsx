import { PublicPrivacyPage } from "../../components/public-pages";
import { publicPageMetadata } from "../../lib/page-metadata";

export const metadata = publicPageMetadata("en", "privacy");

export default function PrivacyPage() {
  return <PublicPrivacyPage locale="en" />;
}
