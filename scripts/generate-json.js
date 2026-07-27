const fs = require('fs');
const path = require('path');

const {
  buildJsonExport,
  loadResources,
  validateResources,
} = require('./lib/resource-pipeline');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'resources.json');

function main() {
  const resources = loadResources(ROOT_DIR);
  const errors = validateResources(resources);

  if (errors.length > 0) {
    console.error('Resource validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const data = buildJsonExport(resources);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Generated resources.json with ${resources.length} resources.`);
}

main();
