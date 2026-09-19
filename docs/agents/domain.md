# Domain Docs

This is a single-context repository.

## Before exploring or changing the project

1. Read `CONTEXT.md` at the repository root.
2. Read the ADRs under `docs/adr/` that affect the area being changed.
3. Read `docs/product-spec.md` for the approved product contract.
4. Read `docs/verification-methodology.md` when work touches claims, evidence, verdicts, scoring or reports.
5. Read the relevant material under `docs/research/` when a decision remains conditional on a technical spike or current provider capability.

If one of these files does not exist, proceed silently.

## File structure

```text
/
├── CONTEXT.md
├── docs/
│   ├── agents/
│   ├── adr/
│   ├── research/
│   ├── product-spec.md
│   └── verification-methodology.md
└── src/
```

## Use the glossary vocabulary

When naming a domain concept in an issue, implementation plan, module, interface or test, use the canonical term from `CONTEXT.md`.

Do not replace a canonical term with a synonym listed under `_Avoid_`.

If a required concept is absent, reconsider whether new terminology is necessary. When it represents a genuine domain gap, resolve it through `/domain-modeling`.

## Respect approved decisions

Do not silently contradict an ADR, the product specification or the verification methodology.

When new evidence justifies reopening a decision, identify the conflicting document explicitly and explain why the trade-off should be reconsidered.

Research documents preserve investigated alternatives and may contain recommendations superseded by later ADRs. Approved ADRs and `docs/product-spec.md` take precedence.

## Keep contexts separate

`CONTEXT.md` is a glossary, not an implementation plan.

- Domain terminology belongs in `CONTEXT.md`.
- Hard-to-reverse implementation decisions belong in `docs/adr/`.
- Product behavior belongs in `docs/product-spec.md`.
- Verification rules belong in `docs/verification-methodology.md`.
- Provider investigations and technical comparisons belong in `docs/research/`.
