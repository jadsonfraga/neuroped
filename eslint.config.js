import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

// Este projeto lina apenas TypeScript/TSX (ver `npm run lint`). No flat config
// do ESLint 9 a opção `--ext` é ignorada e um `js.configs.recommended` global
// passaria a linar também .js/.cjs/.mjs (scripts utilitários, service worker,
// Cloudflare Functions em JS) — fora do escopo de qualidade do app. Por isso
// NÃO aplicamos um bloco JS global: só blocos com `files` de .ts/.tsx têm
// regras. Arquivos JS sem config casada ficam sem regras (0 problemas), o que
// é fiel à intenção original (linar somente TS/TSX).

// eslint:recommended (regras de núcleo: no-empty, no-cond-assign, ...) é
// espalhado DENTRO do bloco TS para continuar valendo em .ts/.tsx.
const tsBaseRules = {
  ...js.configs.recommended.rules,
  ...tsPlugin.configs.recommended.rules,
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
  // @typescript-eslint/no-unused-vars já cobre; a regra JS pura gera duplicata.
  "no-unused-vars": "off",
  // Drizzle e Cloudflare Functions usam require()/CJS em vários pontos.
  "@typescript-eslint/no-require-imports": "off",
  // no-undef é redundante e gera falsos positivos em TS: o próprio tsc
  // (npm run check = 0) valida identificadores não declarados, e a regra não
  // entende globais de DOM/Node nem tipos do TS. Recomendação oficial do
  // typescript-eslint: desligar no-undef em arquivos TypeScript.
  "no-undef": "off",
};

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

  // ---- Catch-all TypeScript: parser TS em TODO .ts/.tsx ----
  // Cobre client/, server/, shared/, functions/ (Cloudflare) e configs na
  // raiz, que antes caíam no parser JS (espree) e davam "Parsing error:
  // interface".
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { ...tsBaseRules },
  },

  // ---- TypeScript + React: client ----
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: { react: { version: "18" } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      // React Hooks — regras explícitas (compatível com v4 e v5)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React 17+ JSX transform: import React não é necessário
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // cmdk-input-wrapper é atributo exigido pela lib cmdk (shadcn/ui Command);
      // seu CSS interno seleciona [cmdk-input-wrapper]. Não é prop desconhecida.
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
    },
  },
];
