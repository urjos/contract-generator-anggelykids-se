import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const testsDir = join(process.cwd(), 'supabase', 'tests');
const files = readdirSync(testsDir)
  .filter((file) => file.endsWith('.test.sql'))
  .sort();

if (files.length === 0) {
  console.error('No pgTAP test files found in supabase/tests.');
  process.exit(1);
}

const remote = process.env.SUPABASE_PROJECT_REF
  ? `--remote=${process.env.SUPABASE_PROJECT_REF}`
  : '--remote';

let failed = false;

for (const file of files) {
  const path = join(testsDir, file);
  console.log(`\n==> ${file}`);

  const command = `npx supabase db query ${remote} --file "${path}" --yes`;
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    failed = true;
    break;
  }

  if (result.status !== 0) {
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
}

console.log('\nAll pgTAP files passed.');
