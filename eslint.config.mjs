import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "coverage/**",
      "node_modules/**",
      "src/generated/prisma/**"
    ]
  }
];

export default eslintConfig;
