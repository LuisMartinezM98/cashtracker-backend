const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  rootDir: ".",
  testMatch: [
    "<rootDir>/src/tests/**/*.test.ts",
    "<rootDir>/src/tests/**/*.spec.ts"
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  openHandlesTimeout: 10 * 1000,
  testTimeout: 10 * 1000,
};