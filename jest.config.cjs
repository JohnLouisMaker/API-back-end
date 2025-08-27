module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./test/authController.test.js"],
  testTimeout: 30000,
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  moduleDirectories: ["node_modules", "src"],
};
