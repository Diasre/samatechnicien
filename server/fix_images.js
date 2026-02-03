const db = require('./database');

const OLD_PORT_STR = ':3000/';
const NEW_PORT_STR = ':8080/';

console.log(`Updating image URLs from ${OLD_PORT_STR} to ${NEW_PORT_STR}...`);

db.serialize(() => {
    // Users
    db.run(`UPDATE users SET image = REPLACE(image, ?, ?) WHERE image LIKE ?`, [OLD_PORT_STR, NEW_PORT_STR, `%${OLD_PORT_STR}%`], function (err) {
        if (err) console.error("Error updating users:", err.message);
        else console.log(`Updated ${this.changes} user images.`);
    });

    // Products - image
    db.run(`UPDATE products SET image = REPLACE(image, ?, ?) WHERE image LIKE ?`, [OLD_PORT_STR, NEW_PORT_STR, `%${OLD_PORT_STR}%`], function (err) {
        if (err) console.error("Error updating products (image):", err.message);
        else console.log(`Updated ${this.changes} product main images.`);
    });

    // Products - image2
    db.run(`UPDATE products SET image2 = REPLACE(image2, ?, ?) WHERE image2 LIKE ?`, [OLD_PORT_STR, NEW_PORT_STR, `%${OLD_PORT_STR}%`], function (err) {
        if (err) console.error("Error updating products (image2):", err.message);
        else console.log(`Updated ${this.changes} product image2.`);
    });

    // Products - image3
    db.run(`UPDATE products SET image3 = REPLACE(image3, ?, ?) WHERE image3 LIKE ?`, [OLD_PORT_STR, NEW_PORT_STR, `%${OLD_PORT_STR}%`], function (err) {
        if (err) console.error("Error updating products (image3):", err.message);
        else console.log(`Updated ${this.changes} product image3.`);
    });
});

// Give it a moment to finish then exit (sqlite3 is async but db.serialize helps)
setTimeout(() => {
    console.log("Done.");
    // process.exit(0); // Let node exit naturally
}, 2000);
