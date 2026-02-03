const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all(`SELECT id, email, role, phone FROM users`, [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log("Current users:");
    rows.forEach((row) => {
        console.log(`${row.id}: ${row.email} (${row.role}) - Phone: ${row.phone}`);
    });
});

db.close();
