import neostandard from 'neostandard';
import type { Linter } from 'eslint';

export default [
  ...neostandard({
    filesTs: ['src/**/*.ts'],
    ignores: ['dist/**/*.js'],
    semi: true,
    ts: true,
  }),
  {
    rules: {
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
    },
  },
] satisfies Linter.Config[];
