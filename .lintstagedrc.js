module.exports = {
  "*": "prettier --ignore-unknown --write",
  "**/*.scss": "stylelint --fix",
  "*.{ts,tsx}": ["bash -c 'npx tsc --noemit'", "eslint --fix"],
};
