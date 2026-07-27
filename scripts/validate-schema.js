const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT_DIR, 'docs', 'resources.schema.json');
const DATA_PATH = path.join(ROOT_DIR, 'resources.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(
      'resources.json does not exist. Run node scripts/generate-json.js first.',
    );
    process.exit(1);
  }

  const schema = readJson(SCHEMA_PATH);
  const data = readJson(DATA_PATH);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const isValid = validate(data);

  const errors = [];

  if (!isValid) {
    for (const error of validate.errors || []) {
      const pointer = error.instancePath || '/';
      errors.push(`${pointer} ${error.message}`);
    }
  }

  if (Array.isArray(data.resources) && typeof data.count === 'number') {
    if (data.resources.length !== data.count) {
      errors.push(
        `count (${data.count}) must match resources length (${data.resources.length}).`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Schema validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('resources.json is valid against docs/resources.schema.json.');
}

main();
