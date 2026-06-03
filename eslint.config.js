module.exports = [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        Date: "readonly",
        Buffer: "readonly",
        Map: "readonly",
        Set: "readonly",
        exports: "readonly"
      }
    },
    rules: {
      "indent": ["error", 2],
      "quotes": "off",
      "semi": ["error", "always"],
      "no-unused-vars": ["warn"],
      "no-console": "off"
    }
  }
];
