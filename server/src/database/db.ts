import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

export function initDatabase(dbPath?: string): Database.Database {
    if (db) {
        return db;
    }

    const finalPath = dbPath || process.env.DATABASE_PATH || join(__dirname, '../../database/swaz.db');

    // Ensure database directory exists
    const dbDir = dirname(finalPath);
    if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(finalPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Set WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Run schema migrations
    runMigrations(db);

    console.log(`✅ Database initialized at: ${finalPath}`);

    return db;
}

function runMigrations(database: Database.Database): void {
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema in a transaction
    const migrate = database.transaction(() => {
        database.exec(schema);
    });

    try {
        migrate();
        console.log('✅ Database migrations completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

export function getDatabase(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('✅ Database closed');
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
});
