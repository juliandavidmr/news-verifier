import { PublicMethodologyPage } from "../../components/public-pages";
import { publicPageMetadata } from "../../lib/page-metadata";

export const metadata = publicPageMetadata("en", "methodology");

export default function MethodologyPage() {
  return <PublicMethodologyPage locale="en" />;
}
