import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // Prettier never inserts blank lines. This rule does, and --fix applies them.
      // `block-like` / `function` miss const chains and useEffect() calls, which
      // are VariableDeclaration / ExpressionStatement.
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
        { blankLine: "always", prev: "*", next: "class" },
        { blankLine: "always", prev: "class", next: "*" },
        {
          blankLine: "always",
          prev: "*",
          next: [
            "multiline-block-like",
            "multiline-expression",
            "multiline-const",
            "multiline-let",
            "multiline-var",
          ],
        },
        {
          blankLine: "always",
          prev: [
            "multiline-block-like",
            "multiline-expression",
            "multiline-const",
            "multiline-let",
            "multiline-var",
          ],
          next: "*",
        },
      ],
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      "vitest/padding-around-all": "error",
    },
  },
);
