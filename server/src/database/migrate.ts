import { initDatabase } from './db.js';

console.log('Running migrations...');
try {
    initDatabase();
    console.log('Migrations complete.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
