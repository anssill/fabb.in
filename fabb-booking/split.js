const fs = require('fs');
const sql = fs.readFileSync('schema_fixed.sql', 'utf8');
const lines = sql.split('\n');

const chunkSize = Math.ceil(lines.length / 3);
for (let i = 0; i < 3; i++) {
  const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n');
  fs.writeFileSync(`schema_part${i + 1}.sql`, chunk);
}
console.log('Split into 3 parts.');
