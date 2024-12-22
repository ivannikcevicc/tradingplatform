import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Warn for @ts-* comments instead of errors
      "@typescript-eslint/ban-ts-comment": ["warn"],

      // Warn for unused variables
      "@typescript-eslint/no-unused-vars": ["warn"],

      // Warn for explicit or unexpected `any` types
      "@typescript-eslint/no-explicit-any": ["warn"],

      // (Optional) Add more rules if necessary
    },
  },
];

export default eslintConfig;
