import eslint from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: ['coverage/**', 'dist/**', 'node_modules/**']
	},
	eslint.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2018,
			sourceType: 'commonjs',
			globals: {
				...globals.node,
				...globals.mocha
			}
		},
		rules: {
			indent: ['error', 'tab', { SwitchCase: 1 }],
			'space-before-function-paren': ['error', { anonymous: 'always', named: 'never' }],
			'no-use-before-define': ['error', { functions: false }],
			'no-console': 'warn',
			'no-underscore-dangle': 'off',
			'no-tabs': 'off'
		}
	}
];
