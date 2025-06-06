import express from 'express';
import multer, { memoryStorage } from 'multer';
import pkg from 'pg';
const { Pool } = pkg;
import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); // Autorise uniquement http://localhost:5173
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Autorise les méthodes HTTP
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Autorise les en-têtes spécifiques
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Autorise les cookies si nécessaire
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // Répond aux requêtes préliminaires CORS
    }
    next();
});

// Configuration de Multer pour gérer les uploads
const upload = multer({
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5 Mo
});

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    user: process.env.SUPABASE_USER,
    host: process.env.SUPABASE_HOST,
    database: process.env.SUPABASE_DATABASE,
    password: process.env.SUPABASE_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false },
});

const sanitizeFilename = (filename) => {
    const fixEncoding = (str) => {
        try {
            return decodeURIComponent(escape(str));
        } catch (e) {
            return str;
        }
    };
  
    const parts = filename.split('.');
    const ext = parts.pop().toLowerCase();
    let name = fixEncoding(parts.join('.'));
  
    const accentMap = {
        'À': 'A', 'Â': 'A', 'Ä': 'A',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'Ç': 'C', 'ç': 'c',
        'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'Î': 'I', 'Ï': 'I', 'î': 'i', 'ï': 'i',
        'Ô': 'O', 'Ö': 'O', 'ô': 'o', 'ö': 'o',
        'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'Ÿ': 'Y', 'ÿ': 'y',
        'Ñ': 'N', 'ñ': 'n',
        'Œ': 'OE', 'œ': 'oe',
        'Æ': 'AE', 'æ': 'ae',
        "'": '-', '_': '-', ' ': '-'
    };
  
    name = name.split('').map(char => accentMap[char] || char).join('');
    name = name.toLowerCase();
    name = name.replace(/[^a-z0-9-]/g, '');
    name = name.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
    return `${name}.${ext}`;
};
        
// Endpoint pour uploader une image
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { originalname, mimetype, buffer } = req.file;
        const { version } = req.body;
        const sanitizedFilename = sanitizeFilename(originalname);

        const query = `
            INSERT INTO jaquette (filename, type, data, version)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const values = [sanitizedFilename, mimetype, buffer, version];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Image uploadée avec succès', imageId: result.rows[0].id });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image.' });
    }
});

app.get('/games', async (req, res) => {
    try {
        const query = 'SELECT version, data FROM jaquette';
        const result = await pool.query(query);

        res.status(200).json(result.rows); // Retourne les versions et les images
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des données.' });
    }
});

// Endpoint pour récupérer une image par ID
app.get('/image/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'SELECT filename, type, data FROM jaquette WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const { filename, type, data } = result.rows[0];

        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Type', type);
        res.send(data);
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).json({ message: 'Error retrieving image' });
    }
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Création de la table jaquette
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS jaquette (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        data BYTEA NOT NULL,
        version VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

pool.query(createTableQuery)
    .then(() => console.log('Table "jaquette" vérifiée ou créée avec succès.'))
    .catch((error) => console.error('Erreur lors de la création de la table "jaquette" :', error));

// Test de connexion à la base de données Supabase
pool.connect()
    .then(client => {
        console.log('✅ Connexion à la base de données Supabase réussie !');
        client.release();
    })
    .catch(err => {
        console.error('❌ Échec de la connexion à la base de données Supabase :', err);
    });