const path = require('path');

const { loadResources, validateResources } = require('./lib/resource-pipeline');

const ROOT_DIR = path.resolve(__dirname, '..');

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

  console.log(`Validated ${resources.length} resources successfully.`);
}

main();
