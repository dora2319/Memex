module.exports = {
    env: {
        browser: true,
        webextensions: true,
    },
    extends: [
        'plugin:jest/recommended',
        'plugin:promise/recommended',
        'standard',
        'standard-react',
        'prettier',
        'prettier/react',
        'prettier/standard',
    ],
    plugins: ['prettier', 'jest', 'standard', 'promise', 'react'],
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        'comma-dangle': ['error', 'always-multiline'],
        quotes: 'off',
        'no-var': 'error',
        'prefer-const': 'error',
        indent: 'off',
        'jest/no-disabled-tests': 'off',
        camelcase: ['error', { properties: 'never' }],
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'jsx-quotes': 'off',
        'operator-linebreak': 'off',
        'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
        'no-unused-vars': 'warn',
        'space-before-function-paren': 'off',
        'space-infix-ops': 'off',
        'no-multi-spaces': ['warn', { ignoreEOLComments: true }],
        'handle-callback-err': 'off',
        'no-return-await': 'off',
        'promise/avoid-new': 'off',
        'promise/param-names': 'off',
        'promise/always-return': 'off',
        'promise/catch-or-return': 'off',
        'promise/valid-params': 'off',
        'import/no-webpack-loader-syntax': 'off',
        'prefer-promise-reject-errors': 'off',
        'react/jsx-filename-extension': 'off',
        'react/prefer-stateless-function': [
            'warn',
            { ignorePureComponents: true },
        ],
        'react/sort-comp': 'warn',
        'react/jsx-max-props-per-line': [1, { when: 'multiline' }],
    },
}
