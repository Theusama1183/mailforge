import type { Config } from "jest"

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/navigation$": "<rootDir>/__mocks__/next-navigation.ts",
    "^next/dynamic$": "<rootDir>/__mocks__/next-dynamic.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest", {
      jsc: {
        parser: { syntax: "typescript", tsx: true },
        transform: { react: { runtime: "automatic" } },
      },
    }],
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/*.stories.*"],
}

export default config
