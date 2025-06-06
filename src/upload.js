import { getVersionForName } from './utils/index.js';

const form = document.getElementById('uploadForm');
const responseMessage = document.getElementById('responseMessage');
const fileInput = document.getElementById('image');
const preview = document.getElementById('preview');
const versionSelect = document.getElementById('version');

Object.entries(getVersionForName).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value;
    versionSelect.appendChild(option);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.classList.add('hidden');
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('version', versionSelect.value);

    try {
        const response = await fetch('https://sae-s6.vercel.app/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseMessage.textContent = `Image uploadée avec succès !`;
        responseMessage.className = "text-green-500";
    } catch (error) {
        responseMessage.textContent = `Erreur lors de l'upload : ${error.message}`;
        responseMessage.className = "text-red-500";
    }
});