
import {
    getVersionForName,
} from "./utils";

const gameSelect = document.createElement('select');
gameSelect.setAttribute('name', 'game');

const games = getVersionForName[item.version.name];
games.forEach((game) => {
  const option = document.createElement('option');
  option.text = game;
  gameSelect.add(option);
});

form.appendChild(gameSelect);
