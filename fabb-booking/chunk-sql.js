const fs = require('fs');
const sql = fs.readFileSync('schema.sql', 'utf8');
const lines = sql.split('\n');

let tablesAndOther = [];
let policiesAndRls = [];

let inPolicy = false;
let policyBuffer = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (trimmed.toLowerCase().startsWith('create policy') || (trimmed.toLowerCase().startsWith('alter table') && trimmed.toLowerCase().includes('enable row level security'))) {
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

const allStatements = [];
let buffer = [];
let inFunction = false;

// process tablesAndOther first
for (let line of tablesAndOther) {
  const trimmed = line.trim();
  buffer.push(line);
  if (trimmed.includes('$$')) {
    inFunction = !inFunction;
  }
  if (!inFunction && trimmed.endsWith(';')) {
    allStatements.push(buffer.join('\n'));
    buffer = [];
  }
}

// then policies 
for (let line of policiesAndRls.join('\n').split('\n')) {
  const trimmed = line.trim();
  buffer.push(line);
  if (trimmed.endsWith(';')) {
    allStatements.push(buffer.join('\n'));
    buffer = [];
  }
}
if (buffer.length > 0 && buffer.join('').trim() !== '') {
  allStatements.push(buffer.join('\n'));
}

const nChunks = 4;
const qPerChunk = Math.ceil(allStatements.length / nChunks);

for (let i = 0; i < nChunks; i++) {
  const chunk = allStatements.slice(i * qPerChunk, (i + 1) * qPerChunk).join('\n\n');
  if (chunk.trim() !== '') {
    fs.writeFileSync(`schema_part${i + 1}.sql`, chunk);
  }
}
console.log('Split into 4 chunks with policies deferred.');
