#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): formats the touched file with Prettier and,
# for JS/TS files, applies ESLint --fix. Non-autofixable ESLint errors are
# reported on stderr with exit 2 so Claude sees them and can fix the file.
set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty')"

# Nothing to do if we didn't get a path, the file doesn't exist, or it lives
# somewhere we shouldn't touch.
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  "$PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac

case "$file" in
  */node_modules/*|*/.next/*|*/.git/*) exit 0 ;;
esac

PRETTIER_BIN="$PROJECT_DIR/node_modules/.bin/prettier"
ESLINT_BIN="$PROJECT_DIR/node_modules/.bin/eslint"

[ -x "$PRETTIER_BIN" ] || exit 0

prettier_output="$("$PRETTIER_BIN" --write --ignore-unknown "$file" 2>&1)"
prettier_status=$?
if [ "$prettier_status" -ne 0 ]; then
  echo "Prettier failed on $file:" >&2
  echo "$prettier_output" >&2
  exit 2
fi

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    if [ -x "$ESLINT_BIN" ]; then
      eslint_output="$("$ESLINT_BIN" --fix "$file" 2>&1)"
      eslint_status=$?
      if [ "$eslint_status" -ne 0 ]; then
        echo "ESLint found issues in $file that could not be auto-fixed:" >&2
        echo "$eslint_output" >&2
        exit 2
      fi
    fi
    ;;
esac

exit 0
