const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESOURCES_DIR = path.join(ROOT_DIR, 'resources');
const README_PATH = path.join(ROOT_DIR, 'README.md');

const CATEGORY_ORDER = [
  { key: 'tools', label: 'Tools' },
  { key: 'books', label: 'Books' },
  { key: 'courses', label: 'Courses' },
  { key: 'websites', label: 'Websites' },
  { key: 'templates', label: 'Templates' },
  { key: 'podcasts', label: 'Podcasts' },
  { key: 'videos', label: 'Videos' },
  { key: 'communities', label: 'Communities' },
];

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

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.toLowerCase().endsWith('.md') && entry.name !== '.gitkeep') {
      files.push(fullPath);
    }
  }

  return files;
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
      data[currentArrayKey].push(arrayMatch[1].trim());
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!keyValueMatch) {
      continue;
    }

    const key = keyValueMatch[1].trim();
    let value = keyValueMatch[2].trim();

    if (value === '') {
      data[key] = [];
      currentArrayKey = key;
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else {
      data[key] = value;
    }

    currentArrayKey = null;
  }

  return { data, body };
}

function extractDescription(markdownBody) {
  const match = markdownBody.match(
    /##\s+Description\s*\n+([\s\S]*?)(?=\n##\s+|$)/i,
  );
  if (!match) {
    return 'No description provided.';
  }

  const plain = match[1].trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  return plain || 'No description provided.';
}

function loadResources() {
  const files = walkMarkdownFiles(RESOURCES_DIR);
  const resources = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);

    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const pathParts = relativePath.split('/');
    const categoryKey = pathParts[1] || 'uncategorized';
    const categoryMeta = CATEGORY_ORDER.find(
      (item) => item.key === categoryKey,
    );

    const title = String(data.title || path.basename(filePath, '.md')).trim();
    const website = String(data.website || '').trim();
    const price = String(data.price || 'Unknown').trim();
    const featured = Boolean(data.featured);
    const tags = Array.isArray(data.tags) ? data.tags : [];

    resources.push({
      title,
      categoryKey,
      categoryLabel: categoryMeta ? categoryMeta.label : 'Other',
      relativePath,
      website,
      price,
      featured,
      tags,
      description: extractDescription(body),
    });
  }

  resources.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  );
  return resources;
}

function renderReadme(resources) {
  const byCategory = new Map();
  const categoryCounts = new Map();

  for (const category of CATEGORY_ORDER) {
    byCategory.set(category.key, []);
    categoryCounts.set(category.key, 0);
  }

  let featuredCount = 0;
  const priceCounts = { Free: 0, 'Open Source': 0, Paid: 0, Unknown: 0 };

  for (const resource of resources) {
    if (!byCategory.has(resource.categoryKey)) {
      byCategory.set(resource.categoryKey, []);
      categoryCounts.set(resource.categoryKey, 0);
    }

    byCategory.get(resource.categoryKey).push(resource);
    categoryCounts.set(
      resource.categoryKey,
      (categoryCounts.get(resource.categoryKey) || 0) + 1,
    );

    if (resource.featured) {
      featuredCount += 1;
    }

    if (priceCounts[resource.price] !== undefined) {
      priceCounts[resource.price] += 1;
    } else {
      priceCounts.Unknown += 1;
    }
  }

  const lines = [];

  lines.push('# Awesome Agile Resources');
  lines.push('');
  lines.push(
    'A community-driven curated collection of Agile tools, Scrum resources, books, courses, templates, podcasts, videos, and communities.',
  );
  lines.push('');
  lines.push(
    'This repository is the single source of truth for Pointaro resources and is designed for search and filtering by category, tags, featured status, and pricing.',
  );
  lines.push('');
  lines.push(
    '> This README is auto-generated by `scripts/generate-readme.js`. Do not edit manually.',
  );
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
  for (const category of CATEGORY_ORDER) {
    lines.push(
      `- ${category.label} (${categoryCounts.get(category.key) || 0})`,
    );
  }
  lines.push('');

  for (const category of CATEGORY_ORDER) {
    lines.push(`## ${category.label}`);
    lines.push('');

    const items = (byCategory.get(category.key) || []).sort((a, b) =>
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
      lines.push(item.description);
      lines.push('');
      lines.push(`- Details: [${item.relativePath}](${item.relativePath})`);
      lines.push(`- Website: ${item.website || 'Not provided'}`);
      lines.push(`- Price: ${item.price}`);
      lines.push(
        `- Tags: ${item.tags.length > 0 ? item.tags.join(', ') : 'None'}`,
      );
      lines.push(`- Featured: ${item.featured ? 'Yes' : 'No'}`);
      lines.push('');
    }
  }

  lines.push('## How to Contribute');
  lines.push('');
  lines.push(
    '- Submit a recommendation through the issue template in `.github/ISSUE_TEMPLATE/resource_request.yml`.',
  );
  lines.push(
    '- Or open a direct pull request adding one Markdown file under `resources/<category>/`.',
  );
  lines.push(
    '- Follow the quality bar in `CONTRIBUTING.md` (no spam, no duplicates, practical Agile value).',
  );
  lines.push('');
  lines.push('See `CONTRIBUTING.md` for the full process and examples.');
  lines.push('');

  lines.push('## Pointaro Integration Notes');
  lines.push('');
  lines.push(
    'Pointaro can parse the YAML frontmatter from each resource file and expose pages such as:',
  );
  lines.push('');
  lines.push('- `/resources`');
  lines.push('- `/resources/tools`');
  lines.push('- `/resources/books`');
  lines.push('- `/resources/courses`');
  lines.push('- `/resources/websites`');
  lines.push('- `/resources/tools/jira`');
  lines.push('- `/resources/books/clean-agile`');
  lines.push('');
  lines.push('Recommended filters: category, tags, price, and featured.');
  lines.push('');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function main() {
  const resources = loadResources();
  const readme = renderReadme(resources);
  fs.writeFileSync(README_PATH, readme, 'utf8');
  console.log(`Generated README with ${resources.length} resources.`);
}

main();
