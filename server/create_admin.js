const bcrypt = require('bcrypt');
const db = require('./database'); // Utiliser la même connexion et initialisation que le serveur

const email = 'Diassecke@gmail.com';
const password = 'P@pepol123456';
const role = 'admin';
const fullName = 'Administrateur';

(async () => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
            if (row) {
                console.log('User already exists. Updating...');
                db.run(`UPDATE users SET role = ?, password = ? WHERE email = ?`, [role, hashedPassword, email], (err) => {
                    if (err) console.error(err);
                    else console.log('User updated successfully.');
                });
            } else {
                console.log('User does not exist. Creating...');
                db.run(`INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)`,
                    [fullName, email, hashedPassword, role],
                    function (err) {
                        if (err) console.error(err);
                        else console.log('Admin user created successfully.');
                    }
                );
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
