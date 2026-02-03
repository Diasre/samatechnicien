const db = require('./database');

function migrate() {
    console.log("Starting comment blocking migration...");

    db.run(`ALTER TABLE users ADD COLUMN commentsEnabled INTEGER DEFAULT 1`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`Column commentsEnabled already exists.`);
            } else {
                console.error(`Error adding commentsEnabled:`, err.message);
            }
        } else {
            console.log(`Column commentsEnabled added successfully.`);
        }
    });

    setTimeout(() => {
        console.log("Migration check finished.");
        process.exit();
    }, 2000);
}

migrate();
