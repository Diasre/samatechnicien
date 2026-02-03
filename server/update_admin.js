const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const targetEmail = 'Diassecke@gmail.com';
// Search currently for lowercase version or similar to update
// We will simply update where email matches the lowercase version 'diassecke@gmail.com'
// If the user hasn't registered yet, this won't do anything, but assuming they have based on context.

db.serialize(() => {
    db.run(`UPDATE users SET email = ? WHERE email = ?`, [targetEmail, 'diassecke@gmail.com'], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);

        // Check if it exists now
        db.get(`SELECT * FROM users WHERE email = ?`, [targetEmail], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row) {
                console.log(`Admin user confirmed: ${row.email}`);
            } else {
                console.log(`No user found with ${targetEmail}. Please register if you haven't.`);
            }
        });
    });
});

db.close();
