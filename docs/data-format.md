# Data Format

All resources live in Markdown files under `resources/` and must include YAML frontmatter.

## Source of truth

- Edit only files in `resources/`.
- `README.md` and `resources.json` are generated automatically.
- Never manually edit generated files.
- Resource IDs must be stable over time, even if filenames change.

## Data contract versioning

- `resources.json` includes a top-level `version` field.
- Current version: `1.0`.
- Patch/minor, backward-compatible additions keep the same major version (for example `1.1`).
- Breaking changes require a major version bump (for example `2.0`).
- Schema for the contract lives in `docs/resources.schema.json`.

## Allowed categories

- Tools
- Books
- Courses
- Websites
- Templates
- Podcasts
- Videos
- Communities

## Frontmatter fields

Required:

- `id` (stable, URL-safe lowercase kebab-case)
- `title`
- `category`
- `website`
- `tags` (array)

Optional:

- `subcategory`
- `price`
- `featured`
- `audience` (array)
- `difficulty`
- `githubUrl`
- `officialUrl`
- `pointaroRecommended`
- `description`
- `status` (`active` | `archived` | `deprecated`)
- `lastReviewed` (`YYYY-MM-DD`)

## Field reference

- `id`: unique stable identifier, used for routing and long-term references.
- `title`: display name.
- `category`: one of the allowed categories.
- `subcategory`: optional secondary grouping.
- `website`: canonical URL.
- `tags`: searchable/filterable labels.
- `price`: pricing label such as `Free`, `Open Source`, `Paid`, or `Unknown`.
- `featured`: whether to prioritize in curated views.
- `audience`: intended readers/users.
- `difficulty`: learning curve label.
- `githubUrl`: optional GitHub URL.
- `officialUrl`: optional official docs/product URL.
- `pointaroRecommended`: Pointaro curation signal.
- `status`: lifecycle state (`active`, `archived`, `deprecated`).
- `lastReviewed`: trust/recency metadata.
- `description`: SEO-friendly summary string.

## Example

```markdown
---
id: linear
title: Linear
category: Tools
subcategory: Project Management
website: https://linear.app
tags:
  - Scrum
  - Agile
  - Issue Tracking
price: Paid
featured: true
audience:
  - Developers
  - Product Owners
difficulty: Beginner
githubUrl: https://github.com/linear
officialUrl: https://linear.app
pointaroRecommended: true
status: active
lastReviewed: 2026-07-27
description: A fast issue tracker for modern product teams.
---

# Linear

## Description

A fast issue tracker for modern product teams.
```

## Generated JSON shape

`resources.json` contains:

- `version` (for example `1.0`)
- `generatedAt` (YYYY-MM-DD)
- `count`
- `resources[]`

Each resource includes:

- `id`
- `title`
- `category`
- `subcategory`
- `website`
- `tags`
- `price`
- `featured`
- `audience`
- `difficulty`
- `githubUrl`
- `officialUrl`
- `pointaroRecommended`
- `status`
- `lastReviewed`
- `description`
- `slug`
- `file`

## Local commands

- `node scripts/validate-resources.js`
- `node scripts/generate-readme.js`
- `node scripts/generate-json.js`
- `node scripts/validate-schema.js`
