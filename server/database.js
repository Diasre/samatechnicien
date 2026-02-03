const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
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
        )`, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
            } else {
                console.log("Users table ready.");
                // Migration for existing databases
                db.run(`ALTER TABLE users ADD COLUMN specialty TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN city TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN district TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN image TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN description TEXT`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN commentsEnabled INTEGER DEFAULT 1`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0`, () => { });
            }
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
        )`, (err) => {
            if (err) {
                console.error("Error creating reviews table:", err.message);
            } else {
                console.log("Reviews table ready.");
            }
        });

        // Create Discussions Table
        db.run(`CREATE TABLE IF NOT EXISTS discussions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            technicianId INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (technicianId) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating discussions table:", err.message);
            } else {
                console.log("Discussions table ready.");
            }
        });

        // Create Discussion Messages Table
        db.run(`CREATE TABLE IF NOT EXISTS discussion_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discussionId INTEGER NOT NULL,
            technicianId INTEGER NOT NULL,
            message TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (discussionId) REFERENCES discussions(id),
            FOREIGN KEY (technicianId) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating discussion_messages table:", err.message);
            } else {
                console.log("Discussion messages table ready.");
            }
        });

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
        )`, (err) => {
            if (err) {
                console.error("Error creating products table:", err.message);
            } else {
                console.log("Products table ready.");
                // Migration for multiple images
                db.run(`ALTER TABLE products ADD COLUMN image2 TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image3 TEXT`, () => { });
                // Migration for status
                db.run(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'available'`, () => { });
                // Migration for image labels
                db.run(`ALTER TABLE products ADD COLUMN image1_label TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image2_label TEXT`, () => { });
                db.run(`ALTER TABLE products ADD COLUMN image3_label TEXT`, () => { });
            }
        });

        // Create Feedback Table
        db.run(`CREATE TABLE IF NOT EXISTS platform_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            userName TEXT,
            content TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating feedback table:", err.message);
            } else {
                console.log("Feedback table ready.");
            }
        });
    }
});

module.exports = db;
