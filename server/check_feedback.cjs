const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all(`SELECT * FROM platform_feedback ORDER BY createdAt DESC LIMIT 5`, (err, rows) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Last 5 feedbacks:");
            console.log(JSON.stringify(rows, null, 2));
        }
    });
});
db.close();
