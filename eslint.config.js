import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

// ESLint config (flat config). Enforces the mechanical style rules described
// in CODESTYLE.md *and* the recommended bug-linting rules from @eslint/js.
export default [
  {
    ignores: ["node_modules/", "ssl/", "**/*.csv"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Node globals (process, console, global, ...) so recommended rules like
      // no-undef don't flag them.
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // else / else if / catch / finally on their own line (cf. CODESTYLE.md).
      // allowSingleLine: true => compact single-line blocks (e.g.
      // `getError() { return this.error; }`) stay allowed.
      "@stylistic/brace-style": ["error", "stroustrup", { allowSingleLine: true }],
      // camelCase naming (cf. CODESTYLE.md).
      "camelcase": ["error", { properties: "always" }],
      // Unused args prefixed with `_` are intentional (e.g. Express handlers
      // that must keep a fixed parameter count: `(req, _res, next)`).
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
