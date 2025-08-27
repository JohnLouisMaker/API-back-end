import prettierPlugin from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

const customRules = {
  "no-console": "warn",
  "no-debugger": "warn",
  radix: ["warn", "always"],
  "class-methods-use-this": "off",
  "no-param-reassign": "off",
  camelcase: "off",
  "prettier/prettier": "error",
};

export default [
  eslintConfigPrettier,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        node: true,
        browser: false,
        process: "readonly",
        console: "readonly",
        module: "readonly",
        require: "readonly",
        __filename: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      ...customRules,
    },
  },

  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierPlugin.configs.recommended.rules,
    },
  },
];
