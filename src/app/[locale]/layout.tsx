export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "fr" }, { locale: "pt" }];
}

export default function LocalizedLayout({
  children,
}: LayoutProps<"/[locale]">) {
  return children;
}
