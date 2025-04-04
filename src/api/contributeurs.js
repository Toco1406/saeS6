import axios from "axios";

/**
 * Récupère les contributeurs du repo GitHub
 * @returns {Promise<Array>}
 */
export async function fetchContributors() {
  const baseUrl = "https://api.github.com";
  const owner = "Toco1406";
  const repo = "saeS6";

  // Récupère le token GitHub depuis la variable d'environnement
  const token = import.meta.env.GITHUB_TOKEN || "";

  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const { data: contributors } = await axios.get(
      `${baseUrl}/repos/${owner}/${repo}/contributors`,
      { headers }
    );

    const enhancedContributors = await Promise.all(
      contributors.map(async (contributor) => {
        try {
          const { data: userInfo } = await axios.get(contributor.url, { headers });

          return {
            ...contributor,
            name: userInfo.name || null,
            login: userInfo.login,
            avatar_url: userInfo.avatar_url,
            html_url: userInfo.html_url,
            bio: userInfo.bio || null,
          };
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails pour ${contributor.login}:`, error);
          return contributor;
        }
      })
    );

    return enhancedContributors;
  } catch (error) {
    console.error("Erreur lors de la récupération des contributeurs GitHub:", error);
    return [];
  }
}

/**
 * Composant des contributeurs GitHub
 */
export default class Contributeurs {
  /**
   * @param {HTMLElement} container - Conteneur où afficher les contributeurs
   */
  constructor(container) {
    this.container = container;
    this.contributors = [];
    this.isLoading = false;
    this.hasError = false;
    this.errorMessage = '';
  }

  async fetchData() {
    try {
      this.isLoading = true;
      this.render();

      this.contributors = await fetchContributors();
      this.isLoading = false;
      this.hasError = false;
    } catch (error) {
      console.error('Erreur lors de la récupération des contributeurs GitHub:', error);
      this.hasError = true;
      this.isLoading = false;
      this.errorMessage = 'Impossible de charger les contributeurs';
    } finally {
      this.render();
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    if (this.isLoading) {
      this.container.innerHTML = `
        <div class="flex justify-center">
          <div class="animate-pulse text-gray-400">Chargement des contributeurs...</div>
        </div>
      `;
      return;
    }

    if (this.hasError) {
      this.container.innerHTML = `
        <div class="text-red-500 text-center">
          ${this.errorMessage}
        </div>
      `;
      return;
    }

    const listElement = document.createElement('ul');
    listElement.className = 'flex flex-wrap justify-center gap-4';

    this.contributors.forEach(contributor => {
      const { login, name, html_url, avatar_url } = contributor;

      const listItem = document.createElement('li');

      const link = document.createElement('a');
      link.href = html_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'flex items-center gap-2 text-blue-500 hover:underline';

      if (avatar_url) {
        const avatar = document.createElement('img');
        avatar.src = avatar_url;
        avatar.alt = `Avatar de ${login}`;
        avatar.className = 'w-6 h-6 rounded-full';
        link.appendChild(avatar);
      }

      const textContent = document.createElement('span');
      textContent.className = 'text-gray-800';
      textContent.textContent = name ? `${name} (${login})` : login;

      link.appendChild(textContent);
      listItem.appendChild(link);
      listElement.appendChild(listItem);
    });

    this.container.appendChild(listElement);
  }

  async init() {
    await this.fetchData();
  }
}
