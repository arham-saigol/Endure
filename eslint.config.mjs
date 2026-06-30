// Flat ESLint config (ESLint 9+, required by Next.js 16 — `next lint` is removed).
// `eslint-config-next/core-web-vitals` mirrors the previous `.eslintrc.json`
// (`extends: "next/core-web-vitals"`), now in flat-config form.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;