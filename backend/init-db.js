const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

// Expand compound ALTER TABLE statements into individual ALTERs
function expandAlterStatements(stmt) {
  const alterMatch = stmt.match(/^ALTER\s+TABLE\s+([`\w]+)\s+([\s\S]+)$/i);
  if (!alterMatch) return [stmt];

  const table = alterMatch[1];
  const rest = alterMatch[2].trim().replace(/;$/, '');

  // Split on commas that precede ADD/DROP/MODIFY/CHANGE at start of a new line (avoid commas inside e.g. ENUM(...))
  const parts = [];
  let current = '';
  let i = 0;
  let parenDepth = 0;
  while (i < rest.length) {
    const ch = rest[i];
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);

    // Detect a split point: comma not inside parentheses followed by newline and operation keyword
    if (parenDepth === 0 && ch === ',') {
      // Lookahead for operation keyword after optional whitespace and newline
      const lookahead = rest.slice(i + 1);
      const opMatch = lookahead.match(/^[\t\r\n\s]*(ADD|DROP|MODIFY|CHANGE)\b/i);
      if (opMatch) {
        parts.push(current.trim());
        current = '';
        i++; // consume comma
        // skip whitespace/newlines after comma
        while (i < rest.length && /[\t\r\n\s]/.test(rest[i])) i++;
        continue; // do not append comma
      }
    }
    current += ch;
    i++;
  }
  if (current.trim().length) parts.push(current.trim());

  // If we didn't actually split, return original
  if (parts.length <= 1) return [stmt];

  // Rebuild individual ALTER statements
  return parts.map(p => `ALTER TABLE ${table} ${p}`);
}

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      console.log(`Running migration: ${file}`);

      // Split file into statements by semicolons at end of statements
      const statements = raw
        .split(/;\s*(\r?\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
        .flatMap(stmt => expandAlterStatements(stmt));

      for (const stmt of statements) {
        try {
          await connection.query(stmt);
        } catch (error) {
          const msg = (error && (error.sqlMessage || error.message || '')).toLowerCase();
          const code = error && error.code;

          const isDuplicateColumn = code === 'ER_DUP_FIELDNAME' || msg.includes('duplicate column');
          const isDuplicateKey = code === 'ER_DUP_KEYNAME' || msg.includes('duplicate key') || (msg.includes('already exists') && msg.includes('index'));
          const isTableExists = code === 'ER_TABLE_EXISTS_ERROR' || (msg.includes('already exists') && msg.includes('table'));
          const isIndexMissingColumn = code === 'ER_KEY_COLUMN_DOES_NOT_EXITS' || msg.includes("doesn't exist in table");

          if (isDuplicateColumn || isDuplicateKey || isTableExists) {
            console.warn(`Skipping benign migration error for statement: ${stmt.substring(0, 120)}...`);
            continue;
          }

          // If index refers to a missing column, just warn and continue (likely because that ADD COLUMN was skipped earlier)
          if (isIndexMissingColumn) {
            console.warn(`Skipping index creation due to missing column for statement: ${stmt.substring(0, 120)}...`);
            continue;
          }

          console.error('Error running migration statement:', { stmt, code: error.code, sqlMessage: error.sqlMessage });
          throw error;
        }
      }
    }
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// If run directly (not required)
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = runMigrations;
