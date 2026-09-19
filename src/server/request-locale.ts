import { cookies, headers } from "next/headers";
import { resolveAcceptedLocale, resolveLocale } from "../lib/i18n";

export async function getRequestLocale() {
  const cookieLocale = (await cookies()).get("nv_locale")?.value;
  return cookieLocale
    ? resolveLocale(cookieLocale)
    : resolveAcceptedLocale((await headers()).get("accept-language"));
}
