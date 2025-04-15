import express from 'express';
import multer, { memoryStorage } from 'multer';
import pkg from 'pg';
const { Pool } = pkg;
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
    user: 'postgres',
    host: 'localhost',
    database: 'jaquette',
    password: 'Dromach30',
    port: 5432,
});

// Endpoint pour uploader une image
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { originalname, mimetype, buffer } = req.file;

        const query = `
            INSERT INTO jaquette (filename, type, data)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const values = [originalname, mimetype, buffer];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Image uploadée avec succès', imageId: result.rows[0].id });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image.' });
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