import { HomeVerifier } from "../components/home-verifier";
import { getRequestLocale } from "../server/request-locale";

export default async function Home() {
  return <HomeVerifier initialLocale={await getRequestLocale()} />;
}
