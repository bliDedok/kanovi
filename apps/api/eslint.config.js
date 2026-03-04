import js from "@eslint/js";

export default [
  // ✅ ignore hasil build
  { ignores: ["dist/**", "node_modules/**"] },

  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  }
];