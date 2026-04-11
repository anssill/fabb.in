const fs = require('fs');

const sql = fs.readFileSync('schema.sql', 'utf8');

// We split the sql roughly into statements
// Moving ALTER TABLE ... ENABLE ROW LEVEL SECURITY and CREATE POLICY ... to the end.

const lines = sql.split('\n');
let tablesAndOther = [];
let policiesAndRls = [];

let inPolicy = false;
let policyBuffer = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (trimmed.toLowerCase().startsWith('create policy') || trimmed.toLowerCase().startsWith('alter table') && trimmed.toLowerCase().includes('enable row level security')) {
    inPolicy = true;
  }
  
  if (inPolicy) {
    policyBuffer.push(line);
    if (trimmed.endsWith(';')) {
      policiesAndRls.push(policyBuffer.join('\n'));
      policyBuffer = [];
      inPolicy = false;
    }
  } else {
    tablesAndOther.push(line);
  }
}

const fixedSql = tablesAndOther.join('\n') + '\n\n-- RLS AND POLICIES --\n\n' + policiesAndRls.join('\n\n');
fs.writeFileSync('schema_fixed.sql', fixedSql);
console.log('Fixed schema written to schema_fixed.sql');
