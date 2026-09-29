module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(cn|@formatjs|next-intl|use-intl|intl-messageformat)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^cn$": "<rootDir>/node_modules/cn/dist/index.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/features/auth/**/*.tsx",
    "src/features/admin/**/*.tsx",
    "src/features/customer-dashboard/**/*.tsx",
    "src/features/customer-jobs/**/*.tsx",
    "src/features/customer-visits/**/*.tsx",
    "src/features/customer-profile/**/*.tsx",
    "src/features/customer-help/**/*.tsx",
    "src/features/post-job/**/*.tsx",
    "src/features/chat/**/*.tsx",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};