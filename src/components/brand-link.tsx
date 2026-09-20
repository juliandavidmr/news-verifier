export function BrandLink({
  label,
  href = "/",
}: {
  label: string;
  href?: string;
}) {
  return (
    <a className="brand" href={href} aria-label={label}>
      <span className="brand-mark" aria-hidden="true" />
      {label}
    </a>
  );
}
