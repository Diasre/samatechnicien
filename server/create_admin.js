const bcrypt = require('bcrypt');
const db = require('./database'); // Utiliser la même connexion et initialisation que le serveur

const email = 'Diassecke@gmail.com';
const password = 'P@pepol123456';
const role = 'admin';
const fullName = 'Administrateur';

(async () => {
    try {
        // Wait for database tables to be created (Postgres)
        if (db.ready) {
            console.log("WAITING for DB Init...");
            await db.ready;
            console.log("DB Init Complete. Proceeding with Admin check...");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if admin exists using LOWER(email) for case-insensitivity
        db.get(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email], (err, row) => {
            if (err) {
                console.error("Error checking user:", err);
                process.exit(1);
            }

            if (row) {
                console.log('User already exists (ID: ' + row.id + '). Updating password & role...');
                // PostgreSQL/SQLite compatible update
                db.run(`UPDATE users SET role = ?, password = ? WHERE LOWER(email) = LOWER(?)`, [role, hashedPassword, email], (err) => {
                    if (err) console.error("Update Error:", err);
                    else console.log('✅ User updated successfully.');
                    process.exit(0);
                });
            } else {
                console.log('User does not exist. Creating...');
                db.run(`INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)`,
                    [fullName, email, hashedPassword, role],
                    function (err) {
                        if (err) console.error("Insert Error:", err);
                        else console.log('✅ Admin user created successfully.');
                        process.exit(0);
                    }
                );
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
