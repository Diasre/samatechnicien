require('dotenv').config(); // Load variables from .env file (for local use)
const { Pool } = require('pg');

// Use the provided DATABASE_URL or throw an error
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ FATAL: DATABASE_URL is missing.");
    console.error("Please ensure you have set the DATABASE_URL environment variable.");
    process.exit(1);
}

console.log("🔌 Connecting to PostgreSQL...");

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Neon/Render connection
    }
});

// Initialize Database Tables for Postgres
const initPostgres = async () => {
    let client;
    try {
        client = await pool.connect();

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
    } catch (err) {
        console.error("❌ Error initializing PostgreSQL:", err);
    } finally {
        if (client) client.release();
    }
};

// Start initialization
const connectionPromise = initPostgres();

// Define the DB object ensuring SQLite compatibility methods (wrapper)
const db = {
    ready: connectionPromise, // Expose promise

    // Run: INSERT, UPDATE, DELETE
    run: function (sql, params, callback) {
        // Handle optional params
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        // Convert SQLite '?' params to Postgres '$1, $2, $3' syntax
        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

        // IMPORTANT: PostgreSQL does NOT return 'id' by default on INSERT. 
        // We must append 'RETURNING id' manually if it's an insert and not present.
        let isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
        let finalSql = pgSql;
        if (isInsert && !finalSql.toUpperCase().includes('RETURNING')) {
            finalSql += ' RETURNING id';
        }

        pool.query(finalSql, params, (err, res) => {
            if (callback) {
                // Mocking SQLite context "this"
                const context = {};
                if (res) {
                    context.changes = res.rowCount;
                    if (res.rows.length > 0 && res.rows[0].id) {
                        context.lastID = res.rows[0].id; // For INSERTs
                    }
                }
                callback.call(context, err);
            }
        });
    },

    // All: SELECT multiple rows
    all: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

        pool.query(pgSql, params, (err, res) => {
            callback(err, res ? res.rows : []);
        });
    },

    // Get: SELECT single row
    get: function (sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        let paramCount = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);

        pool.query(pgSql, params, (err, res) => {
            callback(err, res && res.rows.length > 0 ? res.rows[0] : undefined);
        });
    }
};

module.exports = db;
