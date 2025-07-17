const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.sqlite');
const db = new Database(dbPath);

console.log('=== Migration Fix Script ===');

function columnExists(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(col => col.name === columnName);
}

function indexExists(indexName) {
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type = 'index' AND name = ?
  `).all(indexName);
  return indexes.length > 0;
}

// Check and add missing columns to notes table
console.log('\n=== Fixing Notes Table ===');
const notesColumns = [
  { name: 'caller_name', sql: 'ALTER TABLE notes ADD COLUMN caller_name TEXT NOT NULL DEFAULT ""' },
  { name: 'caller_email', sql: 'ALTER TABLE notes ADD COLUMN caller_email TEXT NOT NULL DEFAULT ""' },
  { name: 'caller_location', sql: 'ALTER TABLE notes ADD COLUMN caller_location TEXT NOT NULL DEFAULT ""' },
  { name: 'caller_address', sql: 'ALTER TABLE notes ADD COLUMN caller_address TEXT NOT NULL DEFAULT ""' },
  { name: 'call_reason', sql: 'ALTER TABLE notes ADD COLUMN call_reason TEXT NOT NULL DEFAULT ""' }
];

notesColumns.forEach(column => {
  if (!columnExists('notes', column.name)) {
    try {
      db.exec(column.sql);
      console.log(`✅ Added column: ${column.name}`);
    } catch (error) {
      console.log(`❌ Failed to add column ${column.name}:`, error.message);
    }
  } else {
    console.log(`ℹ️ Column ${column.name} already exists`);
  }
});

// Check and add missing columns to users table
console.log('\n=== Fixing Users Table ===');
if (!columnExists('users', 'email')) {
  try {
    db.exec('ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ""');
    console.log('✅ Added email column to users table');
  } catch (error) {
    console.log('❌ Failed to add email column:', error.message);
  }
} else {
  console.log('ℹ️ Email column already exists in users table');
}

// Check and add unique indexes
console.log('\n=== Fixing Unique Indexes ===');
if (!indexExists('users_email_unique')) {
  try {
    db.exec('CREATE UNIQUE INDEX users_email_unique ON users (email)');
    console.log('✅ Added unique index for email');
  } catch (error) {
    console.log('❌ Failed to add email unique index:', error.message);
  }
} else {
  console.log('ℹ️ Email unique index already exists');
}

if (!indexExists('users_username_unique')) {
  try {
    db.exec('CREATE UNIQUE INDEX users_username_unique ON users (username)');
    console.log('✅ Added unique index for username');
  } catch (error) {
    console.log('❌ Failed to add username unique index:', error.message);
  }
} else {
  console.log('ℹ️ Username unique index already exists');
}

// Now mark the migration as applied by updating the journal
console.log('\n=== Updating Migration Journal ===');

// Check if we have any data that needs email addresses filled in
const usersWithoutEmail = db.prepare(`
  SELECT COUNT(*) as count FROM users WHERE email = '' OR email IS NULL
`).get();

if (usersWithoutEmail.count > 0) {
  console.log(`⚠️  Found ${usersWithoutEmail.count} users without email addresses`);
  console.log('You may want to update these users with proper email addresses');
  
  // For development, we can set placeholder emails
  try {
    db.exec(`
      UPDATE users 
      SET email = 'user_' || id || '@placeholder.com' 
      WHERE email = '' OR email IS NULL
    `);
    console.log('✅ Added placeholder email addresses for existing users');
  } catch (error) {
    console.log('❌ Failed to add placeholder emails:', error.message);
  }
}

// Check notes table for missing data
const notesWithoutCaller = db.prepare(`
  SELECT COUNT(*) as count FROM notes 
  WHERE caller_name = '' OR caller_email = '' OR caller_location = '' 
     OR caller_address = '' OR call_reason = ''
`).get();

if (notesWithoutCaller.count > 0) {
  console.log(`⚠️  Found ${notesWithoutCaller.count} notes without caller information`);
  
  // For development, we can set placeholder data
  try {
    db.exec(`
      UPDATE notes 
      SET 
        caller_name = CASE WHEN caller_name = '' THEN 'Unknown Caller' ELSE caller_name END,
        caller_email = CASE WHEN caller_email = '' THEN 'unknown@placeholder.com' ELSE caller_email END,
        caller_location = CASE WHEN caller_location = '' THEN 'Unknown Location' ELSE caller_location END,
        caller_address = CASE WHEN caller_address = '' THEN 'Unknown Address' ELSE caller_address END,
        call_reason = CASE WHEN call_reason = '' THEN 'No reason provided' ELSE call_reason END
      WHERE caller_name = '' OR caller_email = '' OR caller_location = '' 
         OR caller_address = '' OR call_reason = ''
    `);
    console.log('✅ Added placeholder caller information for existing notes');
  } catch (error) {
    console.log('❌ Failed to add placeholder caller info:', error.message);
  }
}

db.close();
console.log('\n✅ Migration fix completed!');
