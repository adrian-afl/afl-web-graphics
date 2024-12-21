import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import stylisticTs from '@stylistic/eslint-plugin'
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      "@typescript-eslint/eslint-plugin": tseslint.plugin,
      "prettier": prettierPlugin,
      '@stylistic/ts': stylisticTs
    },
    languageOptions: {
      globals: {
        node: true,
        es2020: true,
        mocha: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      parser: tseslint.parser,
    },
    rules: {
      "prettier/prettier": ["error", {
        "printWidth": 80,
        "tabWidth": 2,
        "useTabs": false,
        "semi": true,
        "singleQuote": false,
        "trailingComma": "es5",
        "bracketSpacing": true,
        "arrowParens": "always",
        "endOfLine": "lf"
      }],
      "import/no-unresolved": "off",
      "import/order": ["error", {
        "groups": [
          // Imports of builtins are first
          "builtin",
          // Then sibling and parent imports. They can be mingled together
          ["sibling", "parent"],
          // Then index file imports
          "index",
          // Then any arcane TypeScript imports
          "object",
          // Then the omitted imports: internal, external, type, unknown
        ],
        "newlines-between": "never",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "named": true,
        "warnOnUnassignedImports": true
      }],
      semi: ["off"],
      eqeqeq: "error",
      quotes: "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-unary-minus": "off",
      "@typescript-eslint/no-floating-promises": [
        "warn",
        {
          "allowForKnownSafeCalls": [
            {
              "from": "package",
              "name": ["describe", "it"],
              "package": "node:test"
            }
          ]
        }
      ],
      "prefer-const": "error",
      // "no-console": "error",
      "linebreak-style": ["error", "unix"],
      "comma-dangle": ["error", "only-multiline"],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@stylistic/ts/semi": ["error", "always"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/explicit-member-accessibility": ["error"],
      "@typescript-eslint/no-inferrable-types": [
        "error",
        {
          ignoreParameters: false,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // "@typescript-eslint/member-ordering": ["error"],
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: [
            "variable",
            "classProperty",
            "function",
            "parameter",
            "typeProperty",
            "parameterProperty",
            "classMethod",
            "objectLiteralMethod",
            "typeMethod",
            "accessor",
          ],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: [
            "class",
            "interface",
            "enum",
            "enumMember",
            "typeAlias",
            "typeParameter",
          ],
          format: ["PascalCase"],
        },
      ],
    }
  }
);
