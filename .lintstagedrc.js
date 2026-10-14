module.exports = {
  "*": ["prettier --ignore-unknown --write", "secretlint --maskSecrets"],
  "**/*.scss": "stylelint --fix",
  "*.{ts,tsx}": ["bash -c 'npx tsc --noemit'", "eslint --fix"],
};
