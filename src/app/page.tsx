import { PublicHomePage } from "../components/public-pages";
import { publicPageMetadata } from "../lib/page-metadata";

export const metadata = publicPageMetadata("en", "home");

export default function Home() {
  return <PublicHomePage locale="en" />;
}
