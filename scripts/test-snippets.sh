#!/usr/bin/env bash
# Extracts the tested snippets from web/src/data/pattern-examples.ts and runs their tests.
# Needs Node.js, Go, Python 3 and the .NET SDK. CI runs this in the "Code Example Tests" job.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

npx --yes tsx scripts/extract-snippets.ts

echo "== Go"
(cd snippet-tests/go && go test ./...)

echo "== Python"
python3 -m unittest discover --start-directory snippet-tests/python --verbose

echo "== C#"
dotnet run --project snippet-tests/csharp
