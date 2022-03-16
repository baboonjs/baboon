module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es2021": true
  },
  "plugins": ["@typescript-eslint", "import", "simple-import-sort", "prettier"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended", "plugin:prettier/recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
    "sort-imports": [
      0,
      {
        "allowSeparatedGroups": true,
        "ignoreDeclarationSort": true,
      }
    ],
    "simple-import-sort/imports": "error",
    "@typescript-eslint/no-explicit-any": "off"
  },
  "settings": {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`

        // Choose from one of the "project" configs below or omit to use <root>/tsconfig.json by default

        // use <root>/path/to/folder/tsconfig.json
        "project": "path/to/folder",

        // Multiple tsconfigs (Useful for monorepos)

        // use a glob pattern
        "project": "packages/*/tsconfig.json",

        // use an array
        "project": [
          "packages/module-a/tsconfig.json",
          "packages/module-b/tsconfig.json"
        ],

        // use an array of glob patterns
        "project": [
          "packages/*/tsconfig.json",
          "other-packages/*/tsconfig.json"
        ]
      }
    }

  }
};
