import axios from "axios";

const BASE_URL = "https://api.tcgdex.net/v2/fr";

function formatImageUrl(card) {
    if (!card.image) return null;
    // Format: https://assets.tcgdex.net/en/swsh/swsh3/136/{quality}.{extension}
    // Using high quality and webp format as recommended in the docs
    return `${card.image}/high.webp`;
}

export async function fetchPokemonCards(pokemonName) {
    try {
        console.log("Fetching TCG cards for Pokémon:", pokemonName);
        const url = `${BASE_URL}/cards?name=${encodeURIComponent(pokemonName)}`;
        console.log("URL de la requête:", url);
        const response = await axios.get(url);
        console.log("Réponse de l'API:", response.data);
        console.log("Nombre de cartes trouvées:", response.data.length);
        if (response.data.length > 0) {
            console.log("Structure de la première carte:", response.data[0]);
        }
        return response.data.map(card => ({
            ...card,
            image: formatImageUrl(card)
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des cartes TCG:", error);
        if (error.response) {
            console.error("Détails de l'erreur:", {
                status: error.response.status,
                data: error.response.data
            });
        }
        return [];
    }
}

export async function fetchCardDetails(cardId) {
    try {
        console.log("Fetching details for card:", cardId);
        const response = await axios.get(`${BASE_URL}/cards/${cardId}`);
        console.log("Détails de la carte:", response.data);
        return {
            ...response.data,
            image: formatImageUrl(response.data)
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la carte:", error);
        return null;
    }
} 