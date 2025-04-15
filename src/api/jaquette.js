import express from 'express';
import multer, { memoryStorage } from 'multer';
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

const app = express();
const port = 3000;

// Configuration de Multer pour gérer les uploads
const storage = memoryStorage();
const upload = multer({ storage });

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
        console.log('File received:', req.file);

        const { originalname, mimetype, buffer } = req.file;
        console.log('Original name:', originalname);
        console.log('MIME type:', mimetype);

        // Insertion de l'image dans la base de données
        const query = `
            INSERT INTO jaquette (filename, type, data)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const values = [originalname, mimetype, buffer];
        const result = await pool.query(query, values);

        console.log('Insert result:', result);
        res.status(201).json({ message: 'Image uploaded successfully', imageId: result.rows[0].id });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Error uploading image' });
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