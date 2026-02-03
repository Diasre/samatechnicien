const db = require('./database');
const bcrypt = require('bcrypt');

const technicians = [
    {
        name: "Amadou Diallo",
        specialty: "Réparation Smartphone",
        city: "Dakar",
        district: "Médina",
        phone: "+221 77 123 45 67",
    },
    {
        name: "Fatou Sow",
        specialty: "Maintenance Informatique",
        city: "Dakar",
        district: "Yoff",
        phone: "+221 70 987 65 43",
    },
    {
        name: "Moussa Ndiaye",
        specialty: "Imprimantes & Photocopieurs",
        city: "Thiès",
        district: "Grand Thiès",
        phone: "+221 77 000 00 00",
    },
    {
        name: "Samba Sy",
        specialty: "Installateur Réseau",
        city: "Saint-Louis",
        district: "Ndar Toute",
        phone: "+221 78 111 22 33",
    }
];

async function seed() {
    console.log("Seeding mock technicians...");

    for (const tech of technicians) {
        const email = tech.name.toLowerCase().replace(/\s+/g, '.') + "@samatech.sn";
        const password = await bcrypt.hash('password123', 10);

        db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                console.error(err);
                return;
            }
            if (!row) {
                const sql = `INSERT INTO users (fullName, email, password, role, specialty, city, district, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sql, [tech.name, email, password, 'technician', tech.specialty, tech.city, tech.district, tech.phone], function (err) {
                    if (err) console.error(err);
                    else console.log(`Added ${tech.name} with ID: ${this.lastID}`);
                });
            } else {
                console.log(`${tech.name} already exists.`);
            }
        });
    }
}

// Seed products for technicians
async function seedProducts() {
    console.log("Seeding products...");

    // Get all technicians
    db.all("SELECT id, fullName FROM users WHERE role = 'technician'", [], (err, technicians) => {
        if (err) {
            console.error(err);
            return;
        }

        const productTemplates = [
            { title: "iPhone X 64GB", price: 150000, category: "Smartphone", condition: "Occasion" },
            { title: "Samsung A12", price: 80000, category: "Smartphone", condition: "Neuf" },
            { title: "Ecran HP 24 pouces", price: 45000, category: "Informatique", condition: "Bon état" },
            { title: "Clavier Mécanique", price: 25000, category: "Accessoire", condition: "Neuf" },
            { title: "Chargeur Rapide", price: 10000, category: "Accessoire", condition: "Neuf" },
            { title: "MacBook Air 2015", price: 200000, category: "Laptop", condition: "Occasion" }
        ];

        technicians.forEach(tech => {
            // Check if tech already has products
            db.get("SELECT COUNT(*) as count FROM products WHERE technicianId = ?", [tech.id], (err, row) => {
                if (err) return;
                if (row.count < 3) {
                    // Add 3 products
                    for (let i = 0; i < 3; i++) {
                        const randomProduct = productTemplates[Math.floor(Math.random() * productTemplates.length)];
                        const uniqueTitle = `${randomProduct.title} - ${tech.fullName.split(' ')[0]}`; // Unique-ify title

                        db.run(`INSERT INTO products (technicianId, title, description, price, category, condition, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                tech.id,
                                uniqueTitle,
                                `Vendu par ${tech.fullName}. Excellent produit.`,
                                randomProduct.price,
                                randomProduct.category,
                                randomProduct.condition,
                                `https://source.unsplash.com/random/300x200?tech,${i}`
                            ],
                            (err) => {
                                if (err) console.error(err);
                                else console.log(`Added product for ${tech.fullName}`);
                            }
                        );
                    }
                } else {
                    console.log(`Products already exist for ${tech.fullName}`);
                }
            });
        });
    });
}

seed().then(() => {
    setTimeout(() => {
        // seedProducts();
        setTimeout(() => {
            console.log("Seeding complete.");
            process.exit();
        }, 3000);
    }, 2000);
});
