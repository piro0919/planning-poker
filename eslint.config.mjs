import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";
import sortKeysShorthand from "eslint-plugin-sort-keys-shorthand";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const TS_FILES = ["**/*.ts", "**/*.tsx"];

// .eslintrc.json から移した。google・standard・ext・filenames・typescript-sort-keys は
// ESLint 9 以降で読み込めないか、2023 年から更新が止まっているので外した。
export default tseslint.config(
  {
    ignores: [
      "**/*.d.ts",
      "**/*.js",
      ".next/**",
      "public/**",
      "worker/.wrangler/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: TS_FILES,
  })),
  ...nextVitals,
  {
    files: TS_FILES,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
  },
  {
    files: ["worker/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./worker/tsconfig.json"],
      },
    },
  },
  prettier,
  {
    plugins: {
      perfectionist,
      "sort-destructure-keys": sortDestructureKeys,
      "sort-keys-shorthand": sortKeysShorthand,
      "unused-imports": unusedImports,
    },
    settings: {
      // "detect" のままだと eslint-plugin-react が ESLint 10 で落ちる。
      react: { version: "19" },
    },
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "src/app/"],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "import/newline-after-import": ["error", { count: 1 }],
      "import/order": [
        "error",
        {
          alphabetize: { caseInsensitive: true, order: "asc" },
          warnOnUnassignedImports: true,
        },
      ],
      "import/prefer-default-export": "error",
      "newline-before-return": "error",
      "no-duplicate-imports": "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      // standard から引き継いだもの。
      "no-void": "error",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          next: [
            "break",
            "const",
            "do",
            "export",
            "function",
            "let",
            "return",
            "switch",
            "try",
            "while",
          ],
          prev: "*",
        },
        {
          blankLine: "always",
          next: "*",
          prev: [
            "const",
            "do",
            "export",
            "function",
            "let",
            "return",
            "switch",
            "try",
            "while",
          ],
        },
        { blankLine: "never", next: "import", prev: "*" },
        { blankLine: "never", next: "case", prev: "case" },
        { blankLine: "never", next: "const", prev: "const" },
        { blankLine: "never", next: "let", prev: "let" },
      ],
      // typescript-sort-keys の代わり。型と interface の鍵を昇順に並べる。
      "perfectionist/sort-interfaces": [
        "error",
        { ignoreCase: false, type: "alphabetical" },
      ],
      "perfectionist/sort-object-types": [
        "error",
        { ignoreCase: false, type: "alphabetical" },
      ],
      quotes: ["error", "double"],
      "react-hooks/exhaustive-deps": [
        "error",
        { enableDangerousAutofixThisMayCauseInfiniteLoops: true },
      ],
      "react/jsx-boolean-value": ["error", "always"],
      "react/jsx-newline": ["error", { prevent: true }],
      "react/jsx-sort-props": "error",
      semi: ["error", "always"],
      "sort-destructure-keys/sort-destructure-keys": "error",
      "sort-imports": ["error", { ignoreDeclarationSort: true }],
      "sort-keys-shorthand/sort-keys-shorthand": [
        "error",
        "asc",
        { shorthand: "first" },
      ],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
  }
);
