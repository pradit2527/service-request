// Option lists shared by the request type definitions. Pure module.
// Kept apart from request-types.ts so the definition files can import it without an import cycle.

import { l, type Localized } from "@/lib/i18n";

export type SharedOption = { value: string; label: Localized };

export const ENVIRONMENT: readonly SharedOption[] = [
  { value: "dev", label: l("Development", "Development", "Development") },
  { value: "staging", label: l("Staging / UAT", "Staging / UAT", "Staging / UAT") },
  { value: "prod", label: l("Production", "Production", "Production") },
];

export const YES_NO = (yes: Localized, no: Localized): readonly SharedOption[] => [
  { value: "yes", label: yes },
  { value: "no", label: no },
];
