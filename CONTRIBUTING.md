# Contributing

Thanks for your interest! Issues, ideas and pull requests are all welcome — in English or Spanish.

## Ground rules

1. **One concern per PR.** Small, focused PRs get reviewed fast.
2. **Never commit secrets.** No real keys, tokens, emails or IDs — use placeholders like `YOUR_..._HERE` and keep real values in `.env` (already in `.gitignore`).
3. **Tests must pass.** Run `node --test scripts/nicho-core.test.mjs` (and add a test for any rule you change), then `node scripts/validar-nicho.mjs nichos-ejemplo/ejemplo.json`. Zero npm dependencies is a feature — please keep it that way.
4. **Rebase on `main`** before opening or updating a PR.
5. **Describe how you tested it.** What you ran and what you saw beats any amount of code description.

## Where to start

- Issues labeled [`good first issue`](https://github.com/RosaritoRD/niche-lab/labels/good%20first%20issue) are small and self-contained.
- Not sure about an idea? Open an issue first and we'll talk it through.

## Working with an AI assistant

Claude Code, Codex and similar tools are fine — just review what they write and keep the PR focused.
