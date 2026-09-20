import { PublicHomePage } from "../components/public-pages";
import { publicPageMetadata } from "../lib/page-metadata";

export const metadata = publicPageMetadata("en", "home");
export const dynamic = "force-dynamic";

export default function Home() {
  return <PublicHomePage locale="en" />;
}
