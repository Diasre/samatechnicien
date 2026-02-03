const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

// Check if we are running with a PostgreSQL URL (Production/Render)
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
    console.log("🔌 Connecting to PostgreSQL...");
    // Configuration PostgreSQL
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for Neon/Render connection
        }
    });

    // Initialize Database Tables for Postgres
    const initPostgres = async () => {
        try {
            const client = await pool.connect();
            console.log("✅ Connected to PostgreSQL.");

            // Create Users Table
            await client.query(`CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                fullName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'client',
                specialty TEXT,
                city TEXT,
                district TEXT,
                phone TEXT,
                image TEXT,
                description TEXT,
                commentsEnabled INTEGER DEFAULT 1,
                isBlocked INTEGER DEFAULT 0
            )`);

            // Create Reviews Table
            await client.query(`CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                technicianId INTEGER NOT NULL REFERENCES users(id),
                clientId INTEGER NOT NULL REFERENCES users(id),
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create Discussions Table
            await client.query(`CREATE TABLE IF NOT EXISTS discussions (
                id SERIAL PRIMARY KEY,
                technicianId INTEGER NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create Discussion Messages Table
            await client.query(`CREATE TABLE IF NOT EXISTS discussion_messages (
                id SERIAL PRIMARY KEY,
                discussionId INTEGER NOT NULL REFERENCES discussions(id),
                technicianId INTEGER NOT NULL REFERENCES users(id),
                message TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create Products Table
            await client.query(`CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                technicianId INTEGER NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                condition TEXT,
                image TEXT,
                image1_label TEXT,
                image2 TEXT,
                image2_label TEXT,
                image3 TEXT,
                image3_label TEXT,
                status TEXT DEFAULT 'available',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create Feedback Table
            await client.query(`CREATE TABLE IF NOT EXISTS platform_feedback (
                id SERIAL PRIMARY KEY,
                userId INTEGER REFERENCES users(id),
                userName TEXT,
                content TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            console.log("✅ PostgreSQL Tables Ready");
            client.release();
        } catch (err) {
            console.error("❌ Error initializing PostgreSQL:", err);
        }
    };

    initPostgres();

    // Adapter for SQLite-style methods on top of Postgres
    db = {
        // Run: Used for INSERT, UPDATE, DELETE
        run: function (sql, params, callback) {
            // Convert SQLite '?' params to Postgres '$1, $2, $3' syntax
            let paramCount = 1;
            const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

            // Handle potentially empty params
            const pgParams = params || [];

            pool.query(pgSql, pgParams, (err, res) => {
                if (callback) {
                    // Simulate SQLite 'this' context for lastID and changes
                    const context = {};
                    if (res) {
                        // For INSERT with RETURNING id (we must append this to SQL usually, but let's try a simpler approach or regex)
                        // NOTE: Postgres doesn't return lastID automatically unless we ask.
                        // We will rely on the fact that our critical INSERTs might need adjustment or we patch common ones.
                        // IMPORTANT: Standard 'run' doesn't return rows.
                        context.lastID = res.rows && res.rows.length > 0 ? res.rows[0].id : null;
                        context.changes = res.rowCount;
                    }
                    callback.call(context, err);
                }
            });
        },
        // All: Used for SELECT multiple rows
        all: function (sql, params, callback) {
            let paramCount = 1;
            const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
            const pgParams = params || [];

            pool.query(pgSql, pgParams, (err, res) => {
                callback(err, res ? res.rows : []);
            });
        },
        // Get: Used for SELECT single row
        get: function (sql, params, callback) {
            let paramCount = 1;
            const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
            const pgParams = params || [];

            pool.query(pgSql, pgParams, (err, res) => {
                callback(err, res && res.rows.length > 0 ? res.rows[0] : undefined);
            });
        }
    };

    // Monkey-patching specific queries that need RETURNING ID for Postgres compatibility
    const originalRun = db.run;
    db.run = function (sql, params, callback) {
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            // Append RETURNING id to get the lastID behavior of SQLite
            if (!sql.toUpperCase().includes('RETURNING')) {
                sql += ' RETURNING id';
            }
        }
        originalRun(sql, params, callback);
    };

} else {
    // ---------------------------------------------------------
    // SQLITE IMPLEMENTATION (Legacy/Local)
    // ---------------------------------------------------------
    console.log("💾 Connecting to local SQLite database...");
    const dbPath = path.resolve(__dirname, 'database.sqlite');

    // Original SQLite initialization code...
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database ' + err.message);
        } else {
            console.log('Connected to the SQLite database.');

            // Create Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'client',
                specialty TEXT,
                city TEXT,
                district TEXT,
                phone TEXT,
                image TEXT,
                description TEXT,
                commentsEnabled INTEGER DEFAULT 1,
                isBlocked INTEGER DEFAULT 0
            )`, () => {
                // Migrations
                db.run(`ALTER TABLE users ADD COLUMN specialty TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN city TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN district TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN image TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN description TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN commentsEnabled INTEGER DEFAULT 1`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0`, () => { });
            });

            // Create Reviews Table
            db.run(`CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                technicianId INTEGER NOT NULL,
                clientId INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (technicianId) REFERENCES users(id),
                FOREIGN KEY (clientId) REFERENCES users(id)
            )`);

            // Create Discussions Table
            db.run(`CREATE TABLE IF NOT EXISTS discussions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                technicianId INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (technicianId) REFERENCES users(id)
            )`);

            // Create Discussion Messages Table
            db.run(`CREATE TABLE IF NOT EXISTS discussion_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discussionId INTEGER NOT NULL,
                technicianId INTEGER NOT NULL,
                message TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (discussionId) REFERENCES discussions(id),
                FOREIGN KEY (technicianId) REFERENCES users(id)
            )`);

            // Create Products Table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                technicianId INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                condition TEXT,
                image TEXT,
                image1_label TEXT,
                image2 TEXT,
                image2_label TEXT,
                image3 TEXT,
                image3_label TEXT,
                status TEXT DEFAULT 'available',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (technicianId) REFERENCES users(id)
            )`, () => {
                // Migrations
                db.run(`ALTER TABLE products ADD COLUMN image2 TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image3 TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'available'`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image1_label TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image2_label TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image3_label TEXT`, () => { });
            });

            // Create Feedback Table
            db.run(`CREATE TABLE IF NOT EXISTS platform_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                userName TEXT,
                content TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id)
            )`);
        }
    });
}

module.exports = db;
