import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, independently-tested calculation modules (see *.test.js) —
    // kept byte-for-byte as supplied rather than reformatted to house lint conventions.
    "src/calculators/bulkForming.js",
    "src/calculators/bulkForming.test.js",
    "src/calculators/sheetForming.js",
    "src/calculators/sheetForming.test.js",
  ]),
]);

export default eslintConfig;
