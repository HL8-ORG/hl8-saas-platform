export default {
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../../../coverage/apps/admin-api',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^src/(.*)$': '<rootDir>/$1',
    '^@repo/constants/app$': '<rootDir>/../../../packages/constants/app.ts',
    // 使用 mock 文件处理 @hl8/mail 模块
    '^@hl8/mail$': '<rootDir>/__mocks__/@hl8/mail.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(@repo)/)'],
};
