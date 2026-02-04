const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');
const os = require('os');

// Get local IP address - prioritize WiFi/Ethernet over VirtualBox/WSL
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    let fallbackIp = null;

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Prioritize 192.168.1.x addresses (typical home WiFi)
                if (iface.address.startsWith('192.168.1.')) {
                    return iface.address;
                }
                // Save as fallback if it's a valid private IP
                if (!fallbackIp && (iface.address.startsWith('192.168.') || iface.address.startsWith('10.'))) {
                    fallbackIp = iface.address;
                }
            }
        }
    }
    return fallbackIp || 'localhost';
}

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Listen on all network interfaces
// Hardcode IP to match the one used in frontend config to ensure consistency
// BUT prioritize Render's external URL if available
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://${getLocalIpAddress()}:${PORT}`;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Uniquement des images sont autorisées.'));
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.send('Samatechnicien API Running');
});

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
    }
    const imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    res.json({ message: "Succès", url: imageUrl });
});

// Register Endpoint
app.post('/api/register', async (req, res) => {
    const { fullName, email, password, role, specialty, city, district, phone } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (fullName, email, password, role, specialty, city, district, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sql, [fullName, email, hashedPassword, role || 'client', specialty || null, city || null, district || null, phone || null], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: "Cet email est déjà utilisé." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: "Utilisateur créé avec succès",
                userId: this.lastID
            });
        });
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Get Technicians Endpoint
app.get('/api/technicians', (req, res) => {
    const sql = `
        SELECT 
            u.id, u.fullName, u.email, u.role, u.specialty, u.city, u.district, u.phone, u.image, u.description, u.commentsEnabled, u.isBlocked,
            COALESCE(AVG(r.rating), 0) as rating,
            COUNT(r.id) as reviews_count
        FROM users u
        LEFT JOIN reviews r ON u.id = r.technicianId
        WHERE u.role = 'technician'
        GROUP BY u.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Get Clients Endpoint
app.get('/api/clients', (req, res) => {
    const sql = `SELECT id, fullName, email, phone, city, district, isBlocked FROM users WHERE role = 'client'`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Get Single Technician Endpoint
app.get('/api/technicians/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            u.id, u.fullName, u.email, u.role, u.specialty, u.city, u.district, u.phone, u.image, u.description, u.commentsEnabled, u.isBlocked,
            COALESCE(AVG(r.rating), 0) as rating,
            COUNT(r.id) as reviews_count
        FROM users u
        LEFT JOIN reviews r ON u.id = r.technicianId
        WHERE u.id = ? AND u.role = 'technician'
        GROUP BY u.id
    `;
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ message: "Technicien non trouvé" });
            return;
        }
        res.json({
            message: "success",
            data: row
        });
    });
});

// Submit Review Endpoint
app.post('/api/reviews', (req, res) => {
    const { technicianId, clientId, rating, comment } = req.body;

    if (!technicianId || !clientId || !rating) {
        return res.status(400).json({ message: "Note et identifiants requis." });
    }

    // Check if comments are enabled for this technician
    db.get(`SELECT commentsEnabled FROM users WHERE id = ?`, [technicianId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ message: "Technicien non trouvé." });

        if (user.commentsEnabled === 0) {
            return res.status(403).json({ message: "Les avis sont désactivés pour ce technicien." });
        }

        const sql = `INSERT INTO reviews (technicianId, clientId, rating, comment) VALUES (?, ?, ?, ?)`;
        db.run(sql, [technicianId, clientId, rating, comment || ""], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: "success",
                id: this.lastID
            });
        });
    });
});

// Get Reviews for a Technician
app.get('/api/technicians/:id/reviews', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT r.*, u.fullName as clientName 
        FROM reviews r 
        JOIN users u ON r.clientId = u.id 
        WHERE r.technicianId = ? 
        ORDER BY r.createdAt DESC
    `;
    db.all(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Update User Endpoint
// Update User Endpoint
// Update User Endpoint
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { fullName, email, password, currentPassword, specialty, city, district, phone, image, description, commentsEnabled, isBlocked } = req.body;

    const commentsValue = (commentsEnabled === true || commentsEnabled === 1 || commentsEnabled === '1') ? 1 : 0;
    const blockedValue = (isBlocked === true || isBlocked === 1 || isBlocked === '1') ? 1 : 0;

    try {
        if (password && password.trim() !== "") {
            // Check current password first
            const userSql = `SELECT password FROM users WHERE id = ?`;
            db.get(userSql, [id], async (err, user) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

                if (!currentPassword) {
                    return res.status(400).json({ message: "Le mot de passe actuel est requis pour changer votre mot de passe." });
                }

                const match = await bcrypt.compare(currentPassword, user.password);
                if (!match) {
                    return res.status(401).json({ message: "Le mot de passe actuel est incorrect." });
                }

                // If match, proceed with update including new password
                const hashedPassword = await bcrypt.hash(password, 10);
                const sql = `UPDATE users SET fullName = ?, email = ?, password = ?, specialty = ?, city = ?, district = ?, phone = ?, image = ?, description = ?, commentsEnabled = ?, isBlocked = ? WHERE id = ?`;
                db.run(sql, [fullName, email, hashedPassword, specialty, city, district, phone, image, description, commentsValue, blockedValue, id], function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return res.status(400).json({ message: "Cet email est déjà utilisé par un autre compte." });
                        }
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "success", changes: this.changes });
                });
            });
        } else {
            // Password not being changed, just update other fields
            const sql = `UPDATE users SET fullName = ?, email = ?, specialty = ?, city = ?, district = ?, phone = ?, image = ?, description = ?, commentsEnabled = ?, isBlocked = ? WHERE id = ?`;
            db.run(sql, [fullName, email, specialty, city, district, phone, image, description, commentsValue, blockedValue, id], function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: "Cet email est déjà utilisé par un autre compte." });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: "success", changes: this.changes });
            });
        }
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
    }
});

// Delete User Endpoint
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    // Cleanup associated data
    db.run(`DELETE FROM products WHERE technicianId = ?`, [id], (err) => { if (err) console.error(err) });
    db.run(`DELETE FROM reviews WHERE technicianId = ? OR clientId = ?`, [id, id], (err) => { if (err) console.error(err) });
    db.run(`DELETE FROM discussion_messages WHERE technicianId = ?`, [id], (err) => { });
    db.run(`DELETE FROM discussions WHERE technicianId = ?`, [id], (err) => { });

    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Utilisateur supprimé avec succès", changes: this.changes });
    });
});

// Admin Update User Password
app.put('/api/admin/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim() === "") {
        return res.status(400).json({ message: "Le nouveau mot de passe est requis." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `UPDATE users SET password = ? WHERE id = ?`;

        db.run(sql, [hashedPassword, id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Mot de passe mis à jour avec succès", changes: this.changes });
        });
    } catch (e) {
        console.error("Password Update Error:", e);
        res.status(500).json({ error: "Erreur serveur", details: e.message });
    }
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect." });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            if (user.isBlocked) {
                return res.status(403).json({ message: "Votre compte a été bloqué par l'administrateur." });
            }
            // In a real app, generate JWT here
            const { password, ...userWithoutPass } = user;
            res.json({
                message: "Connexion réussie",
                user: userWithoutPass
            });
        } else {
            res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }
    });

});

// Forum API Endpoints

// Get All Discussions
app.get('/api/discussions', (req, res) => {
    const sql = `
        SELECT 
            d.id, d.title, d.content, d.createdAt,
            u.fullName as authorName, u.specialty as authorSpecialty, u.image as authorImage,
            COUNT(dm.id) as messageCount
        FROM discussions d
        JOIN users u ON d.technicianId = u.id
        LEFT JOIN discussion_messages dm ON d.id = dm.discussionId
        GROUP BY d.id
        ORDER BY d.createdAt DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Get Single Discussion with Messages
app.get('/api/discussions/:id', (req, res) => {
    const { id } = req.params;

    // Get discussion
    const discussionSql = `
        SELECT 
            d.id, d.title, d.content, d.createdAt,
            u.fullName as authorName, u.specialty as authorSpecialty, u.image as authorImage
        FROM discussions d
        JOIN users u ON d.technicianId = u.id
        WHERE d.id = ?
    `;

    db.get(discussionSql, [id], (err, discussion) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!discussion) {
            res.status(404).json({ message: "Discussion non trouvée" });
            return;
        }

        // Get messages
        const messagesSql = `
            SELECT 
                dm.id, dm.message, dm.createdAt,
                u.fullName as authorName, u.specialty as authorSpecialty, u.image as authorImage
            FROM discussion_messages dm
            JOIN users u ON dm.technicianId = u.id
            WHERE dm.discussionId = ?
            ORDER BY dm.createdAt ASC
        `;

        db.all(messagesSql, [id], (err, messages) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            res.json({
                message: "success",
                data: {
                    ...discussion,
                    messages: messages
                }
            });
        });
    });
});

// Create New Discussion
app.post('/api/discussions', (req, res) => {
    const { technicianId, title, content } = req.body;

    if (!technicianId || !title || !content) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Verify user is a technician
    db.get(`SELECT role FROM users WHERE id = ?`, [technicianId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || user.role !== 'technician') {
            return res.status(403).json({ message: "Seuls les techniciens peuvent créer des discussions." });
        }

        const sql = `INSERT INTO discussions (technicianId, title, content) VALUES (?, ?, ?)`;
        db.run(sql, [technicianId, title, content], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: "Discussion créée avec succès",
                id: this.lastID
            });
        });
    });
});

// Post Message to Discussion
app.post('/api/discussions/:id/messages', (req, res) => {
    const { id } = req.params;
    const { technicianId, message } = req.body;

    if (!technicianId || !message) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Verify user is a technician
    db.get(`SELECT role FROM users WHERE id = ?`, [technicianId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || user.role !== 'technician') {
            return res.status(403).json({ message: "Seuls les techniciens peuvent poster des messages." });
        }

        const sql = `INSERT INTO discussion_messages (discussionId, technicianId, message) VALUES (?, ?, ?)`;
        db.run(sql, [id, technicianId, message], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: "Message posté avec succès",
                id: this.lastID
            });
        });
    });
});

// Get All Products
app.get('/api/products', (req, res) => {
    const sql = `
        SELECT p.*, u.fullName as technicianName, u.specialty as technicianSpecialty, u.image as technicianImage, u.phone as technicianPhone 
        FROM products p 
        JOIN users u ON p.technicianId = u.id 
        ORDER BY p.createdAt DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Get Products for a Specific Technician
app.get('/api/technicians/:id/products', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM products WHERE technicianId = ? ORDER BY createdAt DESC`;
    db.all(sql, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Create New Product
app.post('/api/products', upload.array('images', 3), (req, res) => {
    const { technicianId, title, description, price, category, condition, image1_label, image2_label, image3_label } = req.body;

    if (!technicianId || !title || !price) {
        return res.status(400).json({ message: "Les champs obligatoires sont manquants (technicien, titre, prix)." });
    }

    const files = req.files || [];
    const image1 = files[0] ? `${BASE_URL}/uploads/${files[0].filename}` : null;
    const image2 = files[1] ? `${BASE_URL}/uploads/${files[1].filename}` : null;
    const image3 = files[2] ? `${BASE_URL}/uploads/${files[2].filename}` : null;

    // Verify user is a technician
    db.get(`SELECT role FROM users WHERE id = ?`, [technicianId], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user || user.role !== 'technician') {
            return res.status(403).json({ message: "Seuls les techniciens peuvent vendre des articles." });
        }

        // Check product limit (Max 3)
        db.get(`SELECT COUNT(*) as count FROM products WHERE technicianId = ?`, [technicianId], (err, countRow) => {
            if (err) return res.status(500).json({ error: err.message });

            if (countRow.count >= 3) {
                // Delete uploaded files if limit reached
                if (req.files) {
                    req.files.forEach(file => {
                        fs.unlink(file.path, (err) => {
                            if (err) console.error("Error deleting file:", err);
                        });
                    });
                }
                return res.status(403).json({ message: "Limite atteinte : Vous ne pouvez publier que 3 articles maximum." });
            }

            const sql = `INSERT INTO products (technicianId, title, description, price, category, condition, image, image2, image3, image1_label, image2_label, image3_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(sql, [technicianId, title, description, price, category, condition, image1, image2, image3, image1_label || '', image2_label || '', image3_label || ''], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({
                    message: "Produit ajouté avec succès",
                    id: this.lastID,
                    images: [image1, image2, image3].filter(Boolean)
                });
            });
        });
    });
});

// Update Product Status Endpoint
app.put('/api/products/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, technicianId } = req.body;

    if (!status || !['available', 'sold'].includes(status)) {
        return res.status(400).json({ message: "Statut invalide (available ou sold)." });
    }

    // Verify ownership
    db.get(`SELECT technicianId FROM products WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Produit non trouvé." });

        // Check if the requester is the owner
        if (row.technicianId != technicianId) {
            return res.status(403).json({ message: "Non autorisé." });
        }

        db.run(`UPDATE products SET status = ? WHERE id = ?`, [status, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Statut mis à jour", status: status });
        });
    });
});

// Update Product Details Endpoint
app.put('/api/products/:id', upload.array('images', 3), (req, res) => {
    const { id } = req.params;
    const { technicianId, title, description, price, category, condition, image1_label, image2_label, image3_label } = req.body;

    if (!technicianId || !title || !price) {
        return res.status(400).json({ message: "Champs requis manquants." });
    }

    // Verify ownership
    db.get(`SELECT technicianId FROM products WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Produit non trouvé." });

        if (row.technicianId != technicianId) {
            return res.status(403).json({ message: "Non autorisé." });
        }

        // Handle images if uploaded
        let sql, params;
        const files = req.files || [];

        if (files.length > 0) {
            // If new files are uploaded, we replace existing ones.
            const image1 = files[0] ? `${BASE_URL}/uploads/${files[0].filename}` : null;
            const image2 = files[1] ? `${BASE_URL}/uploads/${files[1].filename}` : null;
            const image3 = files[2] ? `${BASE_URL}/uploads/${files[2].filename}` : null;

            sql = `UPDATE products SET title = ?, description = ?, price = ?, category = ?, condition = ?, image = ?, image2 = ?, image3 = ?, image1_label = ?, image2_label = ?, image3_label = ? WHERE id = ?`;
            params = [title, description, price, category, condition, image1, image2, image3, image1_label || '', image2_label || '', image3_label || '', id];
        } else {
            // No new files, keep existing
            sql = `UPDATE products SET title = ?, description = ?, price = ?, category = ?, condition = ?, image1_label = ?, image2_label = ?, image3_label = ? WHERE id = ?`;
            params = [title, description, price, category, condition, image1_label || '', image2_label || '', image3_label || '', id];
        }

        db.run(sql, params, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produit mis à jour avec succès" });
        });
    });
});

// Delete Product Endpoint
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
        return res.status(400).json({ message: "technicianId requis pour suppression." });
    }

    // Verify ownership
    db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!product) return res.status(404).json({ message: "Produit non trouvé." });

        if (product.technicianId != technicianId) {
            return res.status(403).json({ message: "Non autorisé. Vous n'êtes pas le propriétaire." });
        }

        // Delete images from server (optional cleanup)
        // [product.image, product.image2, product.image3].forEach(imgUrl => {
        //     if (imgUrl && imgUrl.startsWith('http://localhost:3000/uploads/')) {
        //         const filename = imgUrl.split('/uploads/')[1];
        //         fs.unlink(path.join(__dirname, 'uploads', filename), (err) => {
        //             if (err) console.error("Failed to delete image:", filename);
        //         });
        //     }
        // });

        db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produit supprimé avec succès" });
        });
    });
});

// Feedback Endpoints
app.post('/api/feedback', (req, res) => {
    const { userId, userName, content } = req.body;
    if (!content) {
        return res.status(400).json({ message: "Le contenu est requis." });
    }

    const sql = `INSERT INTO platform_feedback (userId, userName, content) VALUES (?, ?, ?)`;
    db.run(sql, [userId || null, userName || 'Anonyme', content], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", id: this.lastID });
    });
});

app.get('/api/admin/feedback', (req, res) => {
    const sql = `SELECT * FROM platform_feedback ORDER BY createdAt DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.listen(PORT, HOST, () => {
    console.log(`\n🚀 Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: ${BASE_URL}`);
    console.log(`\n📱 Pour tester sur mobile, utilisez: ${BASE_URL}\n`);
});
