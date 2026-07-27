const fs = require('fs');
const path = require('path');

const ALLOWED_CATEGORIES = [
  'Tools',
  'Books',
  'Courses',
  'Websites',
  'Templates',
  'Podcasts',
  'Videos',
  'Communities',
];

const ALLOWED_STATUS = ['active', 'archived', 'deprecated'];
const DATA_CONTRACT_VERSION = '1.0';

const CATEGORY_TO_FOLDER = {
  Tools: 'tools',
  Books: 'books',
  Courses: 'courses',
  Websites: 'websites',
  Templates: 'templates',
  Podcasts: 'podcasts',
  Videos: 'videos',
  Communities: 'communities',
};

const REQUIRED_FIELDS = ['id', 'title', 'category', 'website', 'tags'];

function walkMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseScalar(value) {
  let parsed = value.trim();

  if (
    (parsed.startsWith('"') && parsed.endsWith('"')) ||
    (parsed.startsWith("'") && parsed.endsWith("'"))
  ) {
    parsed = parsed.slice(1, -1);
  }

  if (/^(true|false)$/i.test(parsed)) {
    return parsed.toLowerCase() === 'true';
  }

  return parsed;
}

function parseFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    return { data: {}, body: normalized };
  }

  const endIndex = normalized.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { data: {}, body: normalized };
  }

  const fmText = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 5);
  const lines = fmText.split('\n');
  const data = {};
  let currentArrayKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      continue;
    }

    const arrayMatch = line.match(/^\s*-\s*(.+)$/);
    if (arrayMatch && currentArrayKey) {
      if (!Array.isArray(data[currentArrayKey])) {
        data[currentArrayKey] = [];
      }
      data[currentArrayKey].push(parseScalar(arrayMatch[1]));
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!keyValueMatch) {
      continue;
    }

    const key = keyValueMatch[1].trim();
    const value = keyValueMatch[2].trim();

    if (value === '') {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    data[key] = parseScalar(value);
    currentArrayKey = null;
  }

  return { data, body };
}

function extractDescription(markdownBody) {
  const match = markdownBody.match(
    /##\s+Description\s*\n+([\s\S]*?)(?=\n##\s+|$)/i,
  );

  if (!match) {
    return '';
  }

  return match[1].trim().replace(/\s+/g, ' ');
}

function isValidUrl(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function toStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return defaultValue;
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function resourceFromFile(filePath, rootDir) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const file = path.relative(rootDir, filePath).replace(/\\/g, '/');

  const id = data.id ? String(data.id).trim() : '';
  const title = data.title ? String(data.title).trim() : '';
  const category = data.category ? String(data.category).trim() : '';
  const subcategory = data.subcategory ? String(data.subcategory).trim() : null;
  const website = data.website ? String(data.website).trim() : '';
  const tags = toStringArray(data.tags);
  const price = data.price ? String(data.price).trim() : 'Unknown';
  const featured = toBoolean(data.featured, false);
  const audience = toStringArray(data.audience);
  const difficulty = data.difficulty ? String(data.difficulty).trim() : null;
  const githubUrl = data.githubUrl ? String(data.githubUrl).trim() : null;
  const officialUrl = data.officialUrl ? String(data.officialUrl).trim() : null;
  const pointaroRecommended = toBoolean(data.pointaroRecommended, false);
  const status = data.status ? String(data.status).trim().toLowerCase() : null;
  const lastReviewed = data.lastReviewed
    ? String(data.lastReviewed).trim()
    : null;
  const description = data.description
    ? String(data.description).trim()
    : extractDescription(body) || null;

  return {
    id,
    slug: slugify(id || title),
    title,
    category,
    subcategory,
    website,
    tags,
    price,
    featured,
    audience,
    difficulty,
    githubUrl,
    officialUrl,
    pointaroRecommended,
    status,
    lastReviewed,
    description,
    file,
  };
}

function loadResources(rootDir) {
  const resourcesDir = path.join(rootDir, 'resources');
  const files = walkMarkdownFiles(resourcesDir)
    .filter((filePath) => path.basename(filePath) !== '.gitkeep')
    .sort((a, b) => a.localeCompare(b));

  const resources = files.map((filePath) =>
    resourceFromFile(filePath, rootDir),
  );

  resources.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  );

  return resources;
}

function validateResources(resources) {
  const errors = [];
  const idSet = new Set();
  const websiteSet = new Set();

  for (const resource of resources) {
    for (const field of REQUIRED_FIELDS) {
      const value = resource[field];
      if (field === 'tags') {
        if (!Array.isArray(value) || value.length === 0) {
          errors.push(`${resource.file}: missing required field "${field}".`);
        }
        continue;
      }

      if (!value || String(value).trim() === '') {
        errors.push(`${resource.file}: missing required field "${field}".`);
      }
    }

    if (resource.category && !ALLOWED_CATEGORIES.includes(resource.category)) {
      errors.push(
        `${resource.file}: category "${resource.category}" is invalid. Allowed: ${ALLOWED_CATEGORIES.join(', ')}.`,
      );
    }

    if (resource.website && !isValidUrl(resource.website)) {
      errors.push(
        `${resource.file}: website URL is invalid (${resource.website}).`,
      );
    }

    if (resource.githubUrl && !isValidUrl(resource.githubUrl)) {
      errors.push(
        `${resource.file}: githubUrl is invalid (${resource.githubUrl}).`,
      );
    }

    if (resource.officialUrl && !isValidUrl(resource.officialUrl)) {
      errors.push(
        `${resource.file}: officialUrl is invalid (${resource.officialUrl}).`,
      );
    }

    if (!resource.id) {
      errors.push(`${resource.file}: missing required field "id".`);
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.id)) {
      errors.push(
        `${resource.file}: id "${resource.id}" must be URL-safe lowercase kebab-case.`,
      );
    }

    const idKey = resource.id.toLowerCase();
    if (idSet.has(idKey)) {
      errors.push(`${resource.file}: duplicate id "${resource.id}".`);
    } else {
      idSet.add(idKey);
    }

    const websiteKey = resource.website.toLowerCase();
    if (websiteSet.has(websiteKey)) {
      errors.push(`${resource.file}: duplicate website "${resource.website}".`);
    } else {
      websiteSet.add(websiteKey);
    }

    if (resource.category) {
      const expectedFolder = CATEGORY_TO_FOLDER[resource.category];
      if (
        expectedFolder &&
        !resource.file.startsWith(`resources/${expectedFolder}/`)
      ) {
        errors.push(
          `${resource.file}: category "${resource.category}" should be in resources/${expectedFolder}/.`,
        );
      }
    }

    if (resource.status && !ALLOWED_STATUS.includes(resource.status)) {
      errors.push(
        `${resource.file}: status "${resource.status}" is invalid. Allowed: ${ALLOWED_STATUS.join(', ')}.`,
      );
    }

    if (resource.lastReviewed && !isValidIsoDate(resource.lastReviewed)) {
      errors.push(
        `${resource.file}: lastReviewed "${resource.lastReviewed}" must be a valid YYYY-MM-DD date.`,
      );
    }
  }

  return errors;
}

function buildReadme(resources) {
  const categoryBuckets = new Map(ALLOWED_CATEGORIES.map((name) => [name, []]));
  const priceCounts = { Free: 0, 'Open Source': 0, Paid: 0, Unknown: 0 };
  let featuredCount = 0;

  for (const resource of resources) {
    if (!categoryBuckets.has(resource.category)) {
      categoryBuckets.set(resource.category, []);
    }

    categoryBuckets.get(resource.category).push(resource);

    if (resource.featured) {
      featuredCount += 1;
    }

    if (Object.prototype.hasOwnProperty.call(priceCounts, resource.price)) {
      priceCounts[resource.price] += 1;
    } else {
      priceCounts.Unknown += 1;
    }
  }

  const lines = [];
  lines.push('# Awesome Agile Resources');
  lines.push('');
  lines.push(
    'A community-driven curated collection of Agile resources for Scrum Masters, Agile Coaches, Product Owners, Developers, and Agile teams.',
  );
  lines.push('');
  lines.push(
    'Source of truth: Markdown resources in `resources/` with YAML frontmatter. Generated artifacts: `README.md` and `resources.json` (versioned contract).',
  );
  lines.push('');
  lines.push('> Auto-generated. Do not edit manually.');
  lines.push('');

  lines.push('## Resource Statistics');
  lines.push('');
  lines.push(`- Total resources: ${resources.length}`);
  lines.push(`- Featured resources: ${featuredCount}`);
  lines.push(`- Free: ${priceCounts.Free}`);
  lines.push(`- Open Source: ${priceCounts['Open Source']}`);
  lines.push(`- Paid: ${priceCounts.Paid}`);
  lines.push(`- Unknown: ${priceCounts.Unknown}`);
  lines.push('');

  lines.push('## Categories');
  lines.push('');
  for (const category of ALLOWED_CATEGORIES) {
    lines.push(
      `- ${category} (${(categoryBuckets.get(category) || []).length})`,
    );
  }
  lines.push('');

  for (const category of ALLOWED_CATEGORIES) {
    lines.push(`## ${category}`);
    lines.push('');
    const items = (categoryBuckets.get(category) || []).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    );

    if (items.length === 0) {
      lines.push('_No resources yet. Contributions welcome._');
      lines.push('');
      continue;
    }

    for (const item of items) {
      lines.push(`### ${item.title}`);
      lines.push('');
      lines.push(item.description || 'No description provided.');
      lines.push('');
      lines.push(`- Details: [${item.file}](${item.file})`);
      lines.push(`- Website: ${item.website}`);
      lines.push(`- Price: ${item.price}`);
      lines.push(`- Tags: ${item.tags.join(', ')}`);
      lines.push(`- Featured: ${item.featured ? 'Yes' : 'No'}`);
      lines.push('');
    }
  }

  lines.push('## Contribution');
  lines.push('');
  lines.push('- Submit resources by editing files under `resources/` only.');
  lines.push(
    '- Keep `id` stable and URL-safe (`kebab-case`) even if a file is renamed.',
  );
  lines.push(
    '- Run local validation and generators: `node scripts/validate-resources.js`, `node scripts/generate-readme.js`, `node scripts/generate-json.js`, `node scripts/validate-schema.js`.',
  );
  lines.push(
    '- Do not manually edit generated files (`README.md`, `resources.json`).',
  );
  lines.push('');
  lines.push(
    'See `CONTRIBUTING.md` and `docs/data-format.md` for full details.',
  );
  lines.push('');

  lines.push('## Pointaro Routing Support');
  lines.push('');
  lines.push('- `/resources`');
  lines.push('- `/resources/tools`');
  lines.push('- `/resources/books`');
  lines.push('- `/resources/courses`');
  lines.push('- `/resources/templates`');
  lines.push('- `/resources/tools/jira`');
  lines.push('- `/resources/books/clean-agile`');
  lines.push('');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function buildJsonExport(resources, date = new Date()) {
  const generatedAt = date.toISOString().slice(0, 10);
  return {
    version: DATA_CONTRACT_VERSION,
    generatedAt,
    count: resources.length,
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      category: resource.category,
      subcategory: resource.subcategory,
      website: resource.website,
      tags: resource.tags,
      price: resource.price,
      featured: resource.featured,
      audience: resource.audience,
      difficulty: resource.difficulty,
      githubUrl: resource.githubUrl,
      officialUrl: resource.officialUrl,
      pointaroRecommended: resource.pointaroRecommended,
      status: resource.status,
      lastReviewed: resource.lastReviewed,
      description: resource.description,
      slug: resource.slug,
      file: resource.file,
    })),
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_STATUS,
  CATEGORY_TO_FOLDER,
  DATA_CONTRACT_VERSION,
  buildJsonExport,
  buildReadme,
  isValidIsoDate,
  loadResources,
  parseFrontmatter,
  slugify,
  validateResources,
};
