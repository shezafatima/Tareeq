import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "reference/**", "scripts/**", ".claude/**"]),
  {
    // Content is read through the accessors in src/content/index.ts only (see specs/003-home-core-pages).
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/content/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/content/data/*", "**/content/data/*"],
              message: "Import content through @/content (the accessors), not the data files.",
            },
          ],
        },
      ],
    },
  },
]);
