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

        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
            if (row) {
                console.log('User already exists. Updating...');
                db.run(`UPDATE users SET role = ?, password = ? WHERE email = ?`, [role, hashedPassword, email], (err) => {
                    if (err) console.error(err);
                    else console.log('User updated successfully.');
                    process.exit(0); // Terminate script
                });
            } else {
                console.log('User does not exist. Creating...');
                db.run(`INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)`,
                    [fullName, email, hashedPassword, role],
                    function (err) {
                        if (err) console.error(err);
                        else console.log('Admin user created successfully.');
                        process.exit(0); // Terminate script
                    }
                );
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
