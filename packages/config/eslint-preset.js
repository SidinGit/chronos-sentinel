module.exports = {
  extends: ["next", "prettier", "eslint:recommended"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "no-unused-vars": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve("next/babel")],
    },
  },
};