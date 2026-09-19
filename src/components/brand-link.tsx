import { Verificado } from "@mteherandev/colombia-icons-react";

export function BrandLink({ label }: { label: string }) {
  return (
    <a className="brand" href="/" aria-label={label}>
      <span className="brand-mark" aria-hidden="true">
        <Verificado size={20} />
      </span>
      {label}
    </a>
  );
}
