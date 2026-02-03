const db = require('./database');

function migrate() {
    console.log("Starting technician blocking migration...");

    db.run(`ALTER TABLE users ADD COLUMN isBlocked INTEGER DEFAULT 0`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`Column isBlocked already exists.`);
            } else {
                console.error(`Error adding isBlocked:`, err.message);
            }
        } else {
            console.log(`Column isBlocked added successfully.`);
        }
    });

    setTimeout(() => {
        console.log("Migration check finished.");
        process.exit();
    }, 2000);
}

migrate();
