const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const {
  ALLOWED_CATEGORIES,
  DATA_CONTRACT_VERSION,
  buildJsonExport,
  isValidIsoDate,
  parseFrontmatter,
  slugify,
  validateResources,
} = require('../scripts/lib/resource-pipeline');

const schemaPath = path.join(__dirname, '..', 'docs', 'resources.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

test('parseFrontmatter reads scalars, arrays, and booleans', () => {
  const markdown = `---\ntitle: Linear\ncategory: Tools\nwebsite: https://linear.app\ntags:\n  - Scrum\n  - Agile\nfeatured: true\n---\n\n# Linear\n`;
  const { data } = parseFrontmatter(markdown);

  assert.equal(data.title, 'Linear');
  assert.equal(data.category, 'Tools');
  assert.equal(data.website, 'https://linear.app');
  assert.deepEqual(data.tags, ['Scrum', 'Agile']);
  assert.equal(data.featured, true);
});

test('slugify generates URL-safe slugs', () => {
  assert.equal(
    slugify('Scrum: The Art of Doing Twice the Work in Half the Time'),
    'scrum-the-art-of-doing-twice-the-work-in-half-the-time',
  );
});

test('validateResources catches missing fields, invalid URLs, category mismatch, and duplicates', () => {
  const resources = [
    {
      id: 'jira',
      title: 'Jira',
      category: 'Tools',
      website: 'https://atlassian.com/jira',
      tags: ['Scrum'],
      githubUrl: null,
      officialUrl: null,
      file: 'resources/tools/jira.md',
    },
    {
      id: '',
      title: '',
      category: 'Tool',
      website: 'bad-url',
      tags: [],
      status: 'retired',
      lastReviewed: '2026-13-99',
      githubUrl: 'mailto:test@example.com',
      officialUrl: 'ftp://example.com',
      file: 'resources/books/jira.md',
    },
    {
      id: 'jira',
      title: 'Jira Duplicate',
      category: 'Tools',
      website: 'https://atlassian.com/jira-2',
      tags: ['Scrum'],
      status: 'active',
      lastReviewed: '2026-07-27',
      githubUrl: null,
      officialUrl: null,
      file: 'resources/tools/jira-duplicate.md',
    },
  ];

  const errors = validateResources(resources);

  assert.ok(errors.some((e) => e.includes('missing required field "id"')));
  assert.ok(errors.some((e) => e.includes('missing required field "title"')));
  assert.ok(errors.some((e) => e.includes('missing required field "tags"')));
  assert.ok(errors.some((e) => e.includes('category "Tool" is invalid')));
  assert.ok(errors.some((e) => e.includes('website URL is invalid')));
  assert.ok(errors.some((e) => e.includes('duplicate id "jira"')));
  assert.ok(errors.some((e) => e.includes('duplicate website')) === false);
  assert.ok(errors.some((e) => e.includes('githubUrl is invalid')));
  assert.ok(errors.some((e) => e.includes('officialUrl is invalid')));
  assert.ok(errors.some((e) => e.includes('status "retired" is invalid')));
  assert.ok(errors.some((e) => e.includes('lastReviewed "2026-13-99"')));
});

test('buildJsonExport emits versioned contract fields', () => {
  const data = buildJsonExport(
    [
      {
        id: 'linear',
        title: 'Linear',
        category: 'Tools',
        subcategory: 'Project Management',
        website: 'https://linear.app',
        tags: ['Scrum'],
        price: 'Paid',
        featured: true,
        audience: ['Developers'],
        difficulty: 'Beginner',
        githubUrl: null,
        officialUrl: 'https://linear.app',
        pointaroRecommended: true,
        status: 'active',
        lastReviewed: '2026-07-27',
        description: 'Fast issue tracker.',
        slug: 'linear',
        file: 'resources/tools/linear.md',
      },
    ],
    new Date('2026-07-27T00:00:00Z'),
  );

  assert.equal(data.version, DATA_CONTRACT_VERSION);
  assert.equal(data.generatedAt, '2026-07-27');
  assert.equal(data.count, 1);
  assert.equal(data.resources[0].slug, 'linear');
  assert.equal(data.resources[0].pointaroRecommended, true);
  assert.equal(data.resources[0].status, 'active');
  assert.equal(data.resources[0].lastReviewed, '2026-07-27');
});

test('isValidIsoDate validates YYYY-MM-DD dates', () => {
  assert.equal(isValidIsoDate('2026-07-27'), true);
  assert.equal(isValidIsoDate('2026-02-30'), false);
  assert.equal(isValidIsoDate('2026/07/27'), false);
});

test('generated JSON structure is schema compatible', () => {
  const data = buildJsonExport([
    {
      id: 'jira',
      title: 'Jira',
      category: ALLOWED_CATEGORIES[0],
      subcategory: 'Project Management',
      website: 'https://www.atlassian.com/software/jira',
      tags: ['Scrum', 'Agile'],
      price: 'Paid',
      featured: false,
      audience: ['Developers'],
      difficulty: 'Intermediate',
      githubUrl: null,
      officialUrl: 'https://www.atlassian.com/software/jira',
      pointaroRecommended: true,
      status: 'active',
      lastReviewed: '2026-07-27',
      description: 'Issue tracking and project management platform.',
      slug: 'jira',
      file: 'resources/tools/jira.md',
    },
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);

  assert.equal(valid, true, JSON.stringify(validate.errors || [], null, 2));
});
