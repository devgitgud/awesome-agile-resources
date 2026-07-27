# Contributing to Awesome Agile Resources

Thanks for helping improve this community-driven list.

## How to submit resources

1. Open the Resource Request issue template.
2. Fill in all required fields with clear and factual information.
3. A pull request is generated automatically for maintainers to review.
4. Maintainers review quality, relevance, and duplication before merge.

You can also open a direct pull request if you prefer. Add one Markdown file per resource under the matching folder in `resources/`.

## Source of truth and generated files

- `resources/**/*.md` is the single source of truth.
- `README.md` is generated automatically.
- `resources.json` is generated automatically for Pointaro and other consumers.
- Do not manually edit generated files.

## Resource quality requirements

Every resource entry must include:

- A clear description
- Why it is recommended for Agile teams
- Pros and cons
- Target audience
- Alternatives
- Useful and relevant tags

Required frontmatter fields:

- `id` (stable, unique, lowercase kebab-case)
- `title`
- `category`
- `website`
- `tags`

Optional metadata fields supported:

- `subcategory`
- `price`
- `featured`
- `audience`
- `difficulty`
- `githubUrl`
- `officialUrl`
- `pointaroRecommended`
- `description`
- `status` (`active`, `archived`, `deprecated`)
- `lastReviewed` (`YYYY-MM-DD`)

## Review process

1. Automated checks validate format and metadata.
2. `README.md` and `resources.json` are regenerated from Markdown resources.
3. Maintainers verify quality, uniqueness, and category fit.
4. If changes are needed, maintainers request updates.
5. Once approved, the pull request is merged.

## No spam and promotion policy

The list exists to help Agile practitioners, not to advertise.

Do not submit:

- Pure marketing copy
- Affiliate-only links
- Low-effort submissions without practical value
- Duplicate entries already in the repository

## Duplicate policy

Before submitting, search existing entries in `resources/` and `README.md`.

If a similar resource already exists, improve the existing entry instead of adding another duplicate.

Resource IDs must remain stable over time. If you rename a file, keep the same `id` unless you are intentionally creating a new resource record.

## What makes a good submission

Good submission example:

- Resource name: Example Retrospective Board
- Website: https://example.com/retrospectives
- Category: Templates
- Why useful: Provides practical, reusable retrospective formats for distributed Scrum teams.
- Tags: Retrospectives, Scrum, Facilitation

Weak submission example:

- Resource name: Best Tool Ever
- Website: https://example.com
- Why useful: Buy now, huge discount, limited offer.

## Formatting expectations

- Use one file per resource: `resources/<category>/<resource-slug>.md`
- Include valid YAML frontmatter at the top of each file
- Keep naming lowercase with dashes for filenames
- Keep claims accurate and avoid unverifiable statements
- Keep category values to the allowed list in `docs/data-format.md`
- Run local checks before opening a PR:
  - `node scripts/validate-resources.js`
  - `node scripts/generate-readme.js`
  - `node scripts/generate-json.js`
  - `node scripts/validate-schema.js`

## License and conduct

By contributing, you agree that your contribution is licensed under the repository license and you follow the Code of Conduct.
