import createCollaborneConfig from 'eslint-config-collaborne';

export default [
	...createCollaborneConfig({
		project: ['./tsconfig.json', './tsconfig.test.json'],
		tsconfigRootDir: import.meta.dirname,
	}),
	{ ignores: ['lib/**', 'lib-test/**'] },
];
