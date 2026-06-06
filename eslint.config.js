import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // ---- Arquivos ignorados ----
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".claude/**",
      "script/**",
      "**/*.d.ts",
    ],
  },

  // ---- Base JS recomendado ----
  js.configs.recommended,

  // ---- TypeScript: server + shared ----
  {
    files: ["server/**/*.ts", "shared/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Desliga a regra JS pura pois @typescript-eslint/no-unused-vars ja cobre
      "no-unused-vars": "off",
      // Drizzle usa require() em varios pontos; nao bloquear
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // ---- TypeScript + React: client ----
  {
    files: ["client/**/*.ts", "client/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "18" },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      // React Hooks — regras explícitas (compatível com v4 e v5)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      // React 17+ JSX transform: import React nao e necessario
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
