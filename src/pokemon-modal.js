import 'core-js/actual/object';
import WaveSurfer from 'wavesurfer.js';

import {
    fetchPokemonDetails,
    fetchAllTypes,
    fetchPokemonExternalData,
    fetchPokemon,
    fetchEvolutionChain,
    fetchAbilityData,
    fetchGameImages,
    fetchPokemonCards,
    fetchCardDetails,
} from "#api";

import {
    getVersionForName,
    cleanString,
    clearTagContent,
    replaceImage,
    getEvolutionChain,
    statistics,
    getPkmnIdFromURL,
    formsNameDict,
    onTransitionsEnded,
    NB_NUMBER_INTEGERS_PKMN_ID,
    getRegionForName,
} from "./utils";

import {
    createSensibility,
    createAlternateForm,
    createSibling,
    createStatisticEntry,
    getAbilityForLang,
} from "#src/utils/pokemon-modal.utils.js"

import modalPulldownClose from "#src/modal-pulldown-close.js"

import { listPokemon, setTitleTagForGeneration, hasReachPokedexEnd, rippleEffect } from "./main";
import loadingImage from "/images/loading.svg";
import loadingImageRaw from "/images/loading.svg?raw";

const closeModalBtn = document.querySelector("[data-close-modal]");
const modal = document.querySelector("[data-pokemon-modal]");
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
const originalThemeColor = metaThemeColor.getAttribute("content");

const pkmnSensibilityTemplateRaw = document.querySelector(
    "[data-tpl-id='pokemon-sensibility']"
);
const pkmnHighlightTemplateRaw = document.querySelector(
    "[data-tpl-id='pokemon-highlight']"
);

const pkmnTemplateRaw = document.querySelector("[data-tpl-id='pokemon']");
const listPokemonSpritesTemplateRaw = document.querySelector(
    "[data-tpl-id='pokemon-list-sprites']"
);
const pokemonSpriteTemplateRaw = document.querySelector(
    "[data-tpl-id='pokemon-sprite']"
);
const pokemonSiblingTemplateRaw = document.querySelector(
    "[data-tpl-id='pokemon-sibling']"
);
const btnLoadGenerationTemplateRaw = document.querySelector(
    "[data-tpl-id='load-generation-btn']"
);
const pokemonStatisticTempalteRaw = document.querySelector(
    "[data-tpl-id='pokemon-statistic']"
);

const loadGenerationBtn = document.querySelector("[data-load-generation]");

const modal_DOM = {
    pkmnName: modal.querySelector("h2"),
    img: modal.querySelector("img"),
    category: modal.querySelector("[data-category]"),
    listTypes: modal.querySelector("[data-list-types]"),
    listSensibilities: modal.querySelector("[data-list-sensibilities]"),
    listEvolutions: modal.querySelector("[data-list-evolutions]"),
    extraEvolutions: modal.querySelector("[data-extra-evolutions]"),
    sexMaleBarContainer: modal.querySelector("[data-sex='male']"),
    sexAsexualBarContainer: modal.querySelector("[data-sex='asexual']"),
    sexFemaleBarContainer: modal.querySelector("[data-sex='female']"),
    sexRateMale: modal.querySelectorAll("[data-sex-rate='male']"),
    sexRateFemale: modal.querySelectorAll("[data-sex-rate='female']"),
    sexLabelFemale: modal.querySelectorAll("[data-sex-label='female']"),
    sexLabelMale: modal.querySelectorAll("[data-sex-label='male']"),
    height: modal.querySelector("[data-weight]"),
    weight: modal.querySelector("[data-height]"),
    listAbilities: modal.querySelector("[data-list-abilities]"),
    listGames: modal.querySelector("[data-list-games]"),
    nbGames: modal.querySelector("[data-nb-games]"),
    nbRegionalForms: modal.querySelector("[data-nb-regional-forms]"),
    listRegionalForms: modal.querySelector("[data-list-regional-forms]"),
    nbForms: modal.querySelector("[data-nb-forms]"),
    listForms: modal.querySelector("[data-list-forms]"),
    spritesContainer: modal.querySelector("[data-sprites-container]"),
    topInfos: modal.querySelector("[data-top-infos]"),
    listSiblings: modal.querySelector("[data-list-siblings-pokemon]"),
    statistics: modal.querySelector("[data-statistics]"),
    catchRate: modal.querySelector("[data-catch-rate]"),
    acronymVersions: modal.querySelector("[data-pkmn-acronym-versions]"),
    noEvolutionsText: modal.querySelector("[data-no-evolutions]"),
    listNumRegional: modal.querySelector("[data-list-region]"),
    nbNumRegional: modal.querySelector("[data-nb-region]"),
    tcgCards: modal.querySelector("[data-tcg-cards]"),
    tcgCardsCount: modal.querySelector("[data-tcg-cards-count]"),
};

const dataCache = {};
let listAbilitiesCache = [];
const initialPageTitle = document.title;

let listTypes = await fetchAllTypes();
listTypes = listTypes.map((item) => ({
    sprite: item.sprites,
    name: {
        fr: cleanString(item.name.fr),
        en: cleanString(item.name.en),
        jp: cleanString(item.name.jp),
    },
}));

export { listTypes }

const initialModalSpeed = window.getComputedStyle(document.querySelector("dialog")).getPropertyValue("--animation-speed");

const resetModalPosition = () => {
    const modalOriginalBackdropBlur = parseInt(window.getComputedStyle(modal).getPropertyValue("--details-modal-blur"));

    modal.style.setProperty("--details-modal-blur", `${modalOriginalBackdropBlur}px`);
    modal.style.translate = "0px 0px";
    modal.style.opacity = 1;
}

modal.addEventListener("close", async (e) => {
    const url = new URL(location);
    url.searchParams.delete("id");
    url.searchParams.delete("region");
    url.searchParams.delete("alternate_form_id");
    history.pushState({}, "", url);

    const modalOriginalBackdropBlur = parseInt(window.getComputedStyle(modal).getPropertyValue("--details-modal-blur"));

    modal.style.setProperty("--details-modal-blur", "0px");
    modal.dataset.hasBeenTouched = false;

    await onTransitionsEnded(e.target);

    modal.style.setProperty("--details-modal-blur", `${modalOriginalBackdropBlur}px`);

    modal.style.removeProperty("opacity");
    modal.style.removeProperty("translate");

    modal.scrollTo(0, 0);

    modal.dataset.isClosing = false;
    modal_DOM.img.src = loadingImage;
    modal_DOM.img.alt = "";
    setTitleTagForGeneration();
    
    metaThemeColor.setAttribute("content", originalThemeColor);
});

modal.addEventListener("transitionend", (e) => {
    const isClosing = JSON.parse(e.currentTarget.dataset?.isClosing || false)
    if (isClosing) {
        modal.close();
    }
});

modalPulldownClose(modal, modal_DOM.topInfos, resetModalPosition);

closeModalBtn.addEventListener("click", () => {
    if (wavesurfer) {
        wavesurfer.destroy();
        wavesurfer = null;
    }
    modal.close();
    document.title = initialPageTitle;
    metaThemeColor.setAttribute("content", originalThemeColor);
});

let displayModal = null;

let wavesurfer = null;

const initWaveform = () => {
    if (wavesurfer) {
        wavesurfer.destroy();
    }
    
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4B5563',
        progressColor: '#1F2937',
        cursorColor: '#1F2937',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        barGap: 3,
        responsive: true,
    });

    const playPauseBtn = document.getElementById('play-pause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            wavesurfer.playPause();
            playPauseBtn.textContent = wavesurfer.isPlaying() ? 'Pause' : 'Jouer';
        });
    }

    wavesurfer.on('finish', () => {
        playPauseBtn.textContent = 'Jouer';
    });
};

const generatePokemonSiblingsUI = (pkmnData) => {
    const prevPokemon = listPokemon.find((item) => item?.pokedex_id === pkmnData.pokedex_id - 1) || {};
    let nextPokemon = listPokemon.find((item) => item?.pokedex_id === pkmnData.pokedex_id + 1) || null;

    const isLastPokemonOfGen = Number(pkmnData.generation) < Number(loadGenerationBtn.dataset.loadGeneration) && !nextPokemon;

    if (!isLastPokemonOfGen && !nextPokemon) {
        nextPokemon = {}
    }

    [prevPokemon, pkmnData, nextPokemon]
        .filter(Boolean)
        .forEach((item) => {
            const clone = createSibling({
                template: document.importNode(pokemonSiblingTemplateRaw.content, true),
                data: item,
                isCurrentPkmn: item.pokedex_id === pkmnData.pokedex_id,
                isPreviousPkmn: item.pokedex_id < pkmnData.pokedex_id,
                event: loadDetailsModal
            });

            modal_DOM.listSiblings.append(clone);
        });

    if (isLastPokemonOfGen) {
        const clone = document.importNode(
            btnLoadGenerationTemplateRaw.content,
            true
        );

        const button = clone.querySelector("button");
        button.textContent = "Charger la génération suivante";
        button.dataset.loadGeneration = Number(pkmnData.generation) + 1;

        modal_DOM.listSiblings.append(clone);
    }
}

// Définir des constantes pour les "nombres magiques"
const RANDOM_THRESHOLD = 0.5; // Seuil pour la condition aléatoire
const MAX_EVOLUTION_COLUMNS = 3; // Nombre maximum de colonnes pour les évolutions

const loadDetailsModal = async (e, region = null) => {
    e.preventDefault();

    const $el = e.currentTarget;

    const pkmnDataRaw = $el.dataset.pokemonData;
    const pkmnData = JSON.parse(pkmnDataRaw);

    const href = $el.href;
    if(pkmnData.types) {
        let rippleColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[0].name)}`)
        $el.removeAttribute("href");
        if (Math.random() > RANDOM_THRESHOLD && pkmnData.types[1]) {
            rippleColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[1].name)}`)
        }
        await rippleEffect(e, rippleColor);
    }

    $el.href = href;

    const url = new URL(location);

    if (region) {
        url.searchParams.set("region", region);
    } else {
        url.searchParams.delete("region");
    }
    if (pkmnData.alternate_form_id) {
        url.searchParams.set("alternate_form_id", pkmnData.alternate_form_id);
    } else {
        url.searchParams.delete("alternate_form_id");
    }

    url.searchParams.set("id", pkmnData.pokedex_id);

    history.pushState({}, "", url);
    displayModal(pkmnData);
};

displayModal = async (pkmnData) => {
    modal.inert = true;
    modal.setAttribute("aria-busy", true);
    loadGenerationBtn.inert = true;

    if (pkmnData.is_incomplete) {
        const cachedPokemon = listPokemon.find((item) => item?.pokedex_id === pkmnData.pokedex_id);
        if (cachedPokemon) {
            pkmnData = cachedPokemon;
        } else {
            pkmnData = await fetchPokemon(pkmnData.pokedex_id);
        }
    }
    modal.dataset.pokemonData = JSON.stringify(pkmnData);
    document.title = `Chargement - ${initialPageTitle}`;

    modal_DOM.img.src = loadingImage;

    const pkmnId = pkmnData?.alternate_form_id || pkmnData.pokedex_id;

    let pkmnExtraData = dataCache[pkmnId]?.extras;
    let listDescriptions = dataCache[pkmnId]?.descriptions;
    let evolutionLine = dataCache[pkmnId]?.evolutionLine;
    let listAbilities = dataCache[pkmnId]?.listAbilities;

    if (!dataCache[pkmnId]) {
        try {
            listDescriptions = await fetchPokemonExternalData(pkmnData.pokedex_id);
        } catch (_e) {
            listDescriptions = {};
        }

        try {
            // if(pkmnData.evolution === null) {
            //     throw "No evolution";
            // }
            const evolutionReq = await fetchEvolutionChain(listDescriptions.evolution_chain.url);
            evolutionLine = getEvolutionChain(
                evolutionReq,
                {
                    ...pkmnData.evolution,
                    self: {
                        name: pkmnData.name.fr,
                        pokedex_id: pkmnData.pokedex_id,
                        // condition: pkmnData.evolution.pre?.map((item) => item.condition)[0]
                    }
                }, listPokemon);
        } catch (_e) {
            evolutionLine = [];
        }

        try {
            pkmnExtraData = await fetchPokemonDetails(pkmnId);
        } catch (_e) {
            pkmnExtraData = {};
        }

        const listAbilitiesDescriptions = []

        for (const ability of (pkmnExtraData?.abilities || [])) {
            const abilityInCache = listAbilitiesCache.find((item) => item.name.en.toLowerCase() === ability.ability.name.toLowerCase());
            if (abilityInCache) {
                listAbilitiesDescriptions.push(abilityInCache);
            } else {
                try {
                    const abilityData = await fetchAbilityData(ability.ability.url);
                    listAbilitiesDescriptions.push(getAbilityForLang(abilityData));
                } catch (_e) {}
            }
        }

        const listKnownAbilities = listAbilitiesDescriptions.map((item) => cleanString(item.name.fr.toLowerCase().replace("-", "")));
        listAbilities = (pkmnData?.talents || [])
            .filter((item) => listKnownAbilities.includes(cleanString(item.name.toLowerCase().replace("-", ""))))
            .map((item) => ({
                ...item,
                ...listAbilitiesDescriptions.find((description) => cleanString(description.name.fr.toLowerCase().replace("-", "")) === cleanString(item.name.toLowerCase().replace("-", "")))
            }));

        listPokemon[pkmnData.pokedex_id - 1] = pkmnData;

        listAbilitiesCache = [
            ...listAbilitiesCache,
            ...listAbilitiesDescriptions,
        ];

        listAbilitiesCache = Array.from(new Set(listAbilitiesCache.map((item) => JSON.stringify(item)))).map((item) => JSON.parse(item));

        try {
            const tcgCards = await fetchPokemonCards(pkmnData.name.en);
            if (!dataCache[pkmnId]) {
                dataCache[pkmnId] = {};
            }
            dataCache[pkmnId] = {
                ...dataCache[pkmnId],
                tcgCards: tcgCards,
                descriptions: listDescriptions,
                extras: pkmnExtraData,
                evolutionLine,
                listAbilities,
            };
        } catch (_e) {
            if (!dataCache[pkmnId]) {
                dataCache[pkmnId] = {};
            }
            dataCache[pkmnId] = {
                ...dataCache[pkmnId],
                tcgCards: [],
                descriptions: listDescriptions,
                extras: pkmnExtraData,
                evolutionLine,
                listAbilities,
            };
        }
    }

    modal.style.setProperty("--background-sprite", `url("${pkmnExtraData.sprites.other["official-artwork"].front_default}")`);
    replaceImage(modal_DOM.img, pkmnData.sprites.regular);
    modal_DOM.img.alt = `sprite de ${pkmnData.name.fr}`;
    

    modal.setAttribute("aria-labelledby", `Fiche détail de ${pkmnData.name.fr}`);

    modal_DOM.pkmnName.textContent = `#${String(pkmnData.pokedex_id).padStart(NB_NUMBER_INTEGERS_PKMN_ID, '0')} ${pkmnData.name.fr}, ${pkmnData.name.en}, ${pkmnData.name.jp}`;
    document.title = `${modal_DOM.pkmnName.textContent} - ${initialPageTitle}`;

    if (listDescriptions?.is_legendary || listDescriptions?.is_mythical) {
        const cloneHighlight = document.importNode(
            pkmnHighlightTemplateRaw.content,
            true
        );
        const span = cloneHighlight.querySelector("span");
        span.textContent = listDescriptions.is_legendary
            ? "Pokémon Légendaire"
            : "Pokémon Fabuleux";
        span.classList.add(
            listDescriptions.is_legendary ? "bg-amber-400!" : "bg-slate-400!",
            "text-black!"
        );
        modal_DOM.pkmnName.append(cloneHighlight);
    }

    modal_DOM.category.textContent = pkmnData.category;

    clearTagContent(modal_DOM.listTypes);

    const url = new URL(location);
    url.searchParams.set("id", pkmnData.pokedex_id);

    pkmnData.types.forEach((type, idx) => {
        const li = document.createElement("li");
        li.textContent = type.name;
        li.setAttribute("aria-label", `Type ${idx + 1} ${type.name}`);
        li.classList.add(
            ...["py-0.5", "px-2", "rounded-md", "gap-1", "flex", "items-center", "type-name", "w-fit"]
        );
        li.style.backgroundColor = `var(--type-${cleanString(type.name)})`;

        const imgTag = document.createElement("img");
        imgTag.alt = `icône type ${type.name}`;
        replaceImage(imgTag, type.image);

        const encodedData = window.btoa(loadingImageRaw.replaceAll("#037ef3", "#fff"));
        imgTag.src = `data:image/svg+xml;base64,${encodedData}`;

        imgTag.fetchpriority = "low";
        imgTag.loading = "lazy";
        imgTag.classList.add(...["h-5"]);

        li.prepend(imgTag);

        modal_DOM.listTypes.append(li);
    });

    const firstBorderColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[0].name)}`);
    const secondaryBorderColor = window.getComputedStyle(document.body).getPropertyValue(`--type-${cleanString(pkmnData.types[1]?.name || "")}`);

    modal.style.borderTopColor = firstBorderColor;
    modal.style.color = `rgb(from ${firstBorderColor} r g b / 0.4)`;
    modal.style.borderLeftColor = firstBorderColor;
    modal.style.borderRightColor = secondaryBorderColor ? secondaryBorderColor : firstBorderColor;
    modal.style.borderBottomColor = secondaryBorderColor ? secondaryBorderColor : firstBorderColor;
    modal.style.setProperty("--bg-modal-color", firstBorderColor);
    modal.style.setProperty("--dot-color-1", firstBorderColor);
    modal.style.setProperty("--dot-color-2", secondaryBorderColor ? secondaryBorderColor : firstBorderColor);
    
    metaThemeColor.setAttribute("content", firstBorderColor);

    modal.querySelector("[data-top-infos]").style.borderImage = `linear-gradient(to right, ${firstBorderColor} 0%, ${firstBorderColor} 50%, ${secondaryBorderColor ? secondaryBorderColor : firstBorderColor} 50%, ${secondaryBorderColor ? secondaryBorderColor : firstBorderColor} 100%) 1`;
    const descriptionsContainer = modal.querySelector("dl");

    clearTagContent(descriptionsContainer);
    listDescriptions.flavor_text_entries?.filter((item) => item.language.name === "fr").forEach((description) => {
        const dt = document.createElement("dt");
        const versionName = getVersionForName[description.version.name] || "Unknown";
        dt.textContent = versionName;
        dt.classList.add("font-bold");
        descriptionsContainer.append(dt);

        const dd = document.createElement("dd");
        dd.textContent = description.flavor_text;
        dd.classList.add("mb-2");
        descriptionsContainer.append(dd);
    });

    const thresholdNbTotalEvolutions = 7;

    clearTagContent(modal_DOM.listEvolutions);
    const listEvolutionConditions = [];
    if(evolutionLine.length > 1) {
        evolutionLine.forEach((evolution, idx) => {
            const li = document.createElement("li");
            const ol = document.createElement("ol");
            if(evolution.length > MAX_EVOLUTION_COLUMNS) {
                ol.classList.add(...["grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-y-6"]);
            } else {
                ol.classList.add(...["flex"]);
            }
            ol.classList.add(...["gap-x-2", "gap-y-6"]);
            evolution.forEach((item) => {
                const clone = document.importNode(
                    pokemonSpriteTemplateRaw.content,
                    true
                );

                const img = clone.querySelector("img");
                img.alt = `Sprite de ${item.name}`;
                img.classList.replace("w-52", "w-36");
                replaceImage(img, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${item.pokedex_id}.png`);

                const evolutionName = clone.querySelector("p");
                evolutionName.textContent = `#${String(item.pokedex_id).padStart(NB_NUMBER_INTEGERS_PKMN_ID, '0')} ${item.name}`;
                evolutionName.classList.toggle("font-bold", item.pokedex_id === pkmnData.pokedex_id);
                evolutionName.classList.add(...["group-hocus:bg-slate-900", "group-hocus:text-white", "whitespace-pre-line"])

                if (idx > 0) {
                    const evolutionCondition = document.createElement("p");
                    evolutionCondition.classList.add("text-xs", "text-center");
                    evolutionCondition.style.maxWidth = "75%";
                    evolutionCondition.textContent = item.condition;
                    listEvolutionConditions.push(item.condition?.toLowerCase());
                    clone.querySelector("li div").insertAdjacentElement("afterbegin", evolutionCondition);
                }

                const divTag = clone.querySelector("div");
                const evolutionURL = new URL(location);
                evolutionURL.searchParams.set("id", item.pokedex_id);
                const aTag = document.createElement('a');
                aTag.innerHTML = divTag.innerHTML;
                aTag.href = evolutionURL;
                aTag.classList = divTag.classList;
                aTag.classList.add(...["hocus:bg-slate-100", "rounded-md", "p-2"]);
                aTag.dataset.pokemonData = JSON.stringify({ ...item, is_incomplete: true });
                aTag.addEventListener("click", (e) => loadDetailsModal(e));

                divTag.parentNode.replaceChild(aTag, divTag);

                ol.append(clone);
            });

            li.append(ol);
            modal_DOM.listEvolutions.append(li);

            const nextArrow = document.createElement("li");
            if(evolutionLine.flat().length >= thresholdNbTotalEvolutions) {
                nextArrow.textContent = "►";
                nextArrow.classList.add("justify-center");
            } else {
                nextArrow.classList.add("justify-around");
                (evolutionLine?.[idx + 1] || []).forEach(() => {
                    const span = document.createElement("span");
                    span.textContent = "▼";

                    nextArrow.append(span);
                })
            }

            nextArrow.inert = true;
            nextArrow.classList.add(...["flex", "items-center", "last:hidden", "arrow", "font-['serif']"])
            modal_DOM.listEvolutions.append(nextArrow);
        });
    }

    const listAcronymsDOM = Array.from(modal_DOM.acronymVersions.querySelectorAll("[data-acronym]"));
    const listAcronyms = listAcronymsDOM.map((item) => item.dataset.acronym)
    modal_DOM.acronymVersions.classList.toggle("hidden", !listEvolutionConditions.filter(Boolean).some(
        v => listAcronyms.some(acronym => {
            const re = new RegExp(String.raw`[(\s]${acronym}[)\s]`, 'gi');
            return re.test(v.toLowerCase())
        })
    ));

    listAcronyms.forEach((item) => {
        modal_DOM.acronymVersions.querySelector(`[data-acronym="${item}"]`).classList.toggle(
            "hidden",
            !listEvolutionConditions.filter(Boolean).some(evolutionCondition => evolutionCondition.includes(item.toLowerCase()))
        );
    });

    const megaEvolutionLine = pkmnData.evolution?.mega || []; //(pkmnData.evolution?.mega || alternateEvolutions)
    modal_DOM.extraEvolutions.classList.toggle("hidden", !megaEvolutionLine.length);
    if (megaEvolutionLine.length) {
        const extraEvolutionsContainer = modal_DOM.extraEvolutions.querySelector("ul");
        clearTagContent(extraEvolutionsContainer);
        megaEvolutionLine.forEach((item) => {
            const clone = document.importNode(
                pokemonSpriteTemplateRaw.content,
                true
            );

            const img = clone.querySelector("img");
            img.alt = `Sprite de ${item.name}`;
            img.classList.replace("w-52", "w-36");
            replaceImage(img, item.sprites.regular);

            const textContainer = clone.querySelector("p");
            textContainer.textContent = item.orbe ? `avec ${item.orbe}` : "";

            extraEvolutionsContainer.append(clone);
        });
    }

    modal_DOM.noEvolutionsText.classList.toggle("hidden", (evolutionLine.length > 1 || megaEvolutionLine.length > 0))
    modal_DOM.noEvolutionsText.textContent = `${pkmnData.name.fr} n'a pas d'évolution et n'est l'évolution d'aucun Pokémon.`;

    modal_DOM.listEvolutions.classList.toggle("horizontal-evolution-layout", evolutionLine.flat().length >= thresholdNbTotalEvolutions)
    modal_DOM.listEvolutions.classList.toggle("vertical-evolution-layout", evolutionLine.flat().length < thresholdNbTotalEvolutions)

    const hasNoEvolutions = (evolutionLine.flat().length === 0) && (pkmnData.evolution?.mega || []).length === 0;
    modal_DOM.listEvolutions.closest("details").inert = hasNoEvolutions;
    if (hasNoEvolutions) {
        modal_DOM.listEvolutions.closest("details").removeAttribute("open");
    }

    clearTagContent(modal_DOM.listSensibilities);

    for (const sensibility of pkmnData.resistances) {
        const clone = await createSensibility(
            document.importNode(
                pkmnSensibilityTemplateRaw.content,
                true
            ),
            sensibility,
            listTypes
        );

        modal_DOM.listSensibilities.append(clone);
    }

    modal_DOM.sexLabelMale.forEach((item) => {
        item.hidden = pkmnData.sexe?.male === 0 || pkmnData.sexe?.male === undefined;
    });

    modal_DOM.sexLabelFemale.forEach((item) => {
        item.hidden = pkmnData.sexe?.female === 0 || pkmnData.sexe?.female === undefined;
    });

    modal_DOM.sexAsexualBarContainer.classList.toggle(
        "hidden",
        !(
            pkmnData.sexe?.female === undefined &&
            pkmnData.sexe?.male === undefined
        )
    );

    modal_DOM.sexMaleBarContainer.style.width = `${pkmnData.sexe?.male}%`;
    modal_DOM.sexMaleBarContainer.classList.toggle("rounded-md", pkmnData.sexe?.female === 0);
    modal_DOM.sexMaleBarContainer.classList.toggle("hidden", pkmnData.sexe?.male === undefined);
    ["px-2", "py-1"].forEach((className) => {
        modal_DOM.sexMaleBarContainer.classList.toggle(
            className,
            pkmnData.sexe?.male > 0 && pkmnData.sexe?.male !== undefined
        );
    });
    modal_DOM.sexRateMale.forEach((item) => {
        item.textContent = `${pkmnData.sexe?.male}%`;
    });

    modal_DOM.sexFemaleBarContainer.style.width = `${pkmnData.sexe?.female}%`;
    modal_DOM.sexFemaleBarContainer.classList.toggle("rounded-md", pkmnData.sexe?.male === 0);
    modal_DOM.sexFemaleBarContainer.classList.toggle("hidden", pkmnData.sexe?.female === undefined);
    ["px-2", "py-1"].forEach((className) => {
        modal_DOM.sexFemaleBarContainer.classList.toggle(
            className,
            pkmnData.sexe?.female > 0 && pkmnData.sexe?.female !== undefined
        );
    });
    modal_DOM.sexRateFemale.forEach((item) => {
        item.textContent = `${pkmnData.sexe?.female}%`;
    });

    modal_DOM.height.textContent = pkmnData.height;
    modal_DOM.weight.textContent = pkmnData.weight;
    modal_DOM.catchRate.textContent = pkmnData.catch_rate;

    clearTagContent(modal_DOM.listAbilities);

    listAbilities.forEach((item) => {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = item.name.fr;
        summary.classList.add(...["hocus:marker:text-(color:--bg-modal-color)"])

        const abilityDescription = document.createElement("p");
        abilityDescription.textContent = item.description?.replaceAll("\\n", " ");
        abilityDescription.classList.add("ml-4");

        if (item.tc) {
            const clone = document.importNode(
                pkmnHighlightTemplateRaw.content,
                true
            );
            summary.append(clone);
        }
        details.append(summary);
        details.insertAdjacentElement("beforeend", abilityDescription);
        details.classList.add("mb-1.5");

        modal_DOM.listAbilities.append(details);
    });

    clearTagContent(modal_DOM.spritesContainer);

    const listSpritesObj = pkmnExtraData.sprites?.other.home || {};
    const listSprites = [];
    const maxPercentage = 100;
    Object.entries(listSpritesObj).forEach(([key, value]) => {
        if (value === null) {
            return;
        }
        let sexLabel = value.includes("female") ? "female" : "male";
        if (pkmnData.sexe?.male === maxPercentage) {
            sexLabel = "male";
        } else if (pkmnData.sexe?.female === maxPercentage) {
            sexLabel = "female";
        }

        listSprites.push({ name: key, sprite: value, key: sexLabel  });
    });
    const groupedSprites = Object.groupBy(listSprites, ({ key }) =>
        key === "female" ? "Femelle ♀" : "Mâle ♂"
    );

    const isOneSex = pkmnData.sexe?.female === maxPercentage || pkmnData.sexe?.male === maxPercentage;
    Object.entries(groupedSprites).forEach(([key, sprites]) => {
        const listPokemonSpritesTemplate = document.importNode(
            listPokemonSpritesTemplateRaw.content,
            true
        );
        const sexLabel = listPokemonSpritesTemplate.querySelector("p");

        if (Object.keys(groupedSprites).length === 1 && !isOneSex) {
            sexLabel.classList.add("no-dimorphism")
        } else {
            if(key === "Femelle ♀") {
                sexLabel.classList.add(...["bg-pink-300"])
            } else if (key === "Mâle ♂") {
                sexLabel.classList.add(...["bg-sky-300"])
            }
        }

        sexLabel.classList.toggle("hidden", (pkmnData.sexe?.female === undefined && pkmnData.sexe?.male === undefined));

        const listSpritesUI = listPokemonSpritesTemplate.querySelector(
            "[data-list-sprites]"
        );
        sprites.forEach((item) => {
            const label = `${key} ${
                Object.keys(groupedSprites).length === 1 && !isOneSex ? "/ Femelle ♀" : ""
            }`
            sexLabel.textContent = label;

            const pokemonSpriteTemplate = document.importNode(
                pokemonSpriteTemplateRaw.content,
                true
            );

            const img = pokemonSpriteTemplate.querySelector("img");
            replaceImage(img, item.sprite);

            img.alt = `sprite ${key} de ${pkmnData.name.fr}`;

            if (!item.name.includes("shiny")) {
                pokemonSpriteTemplate
                    .querySelector("p")
                    .classList.add("hidden");
            }

            listSpritesUI.append(pokemonSpriteTemplate);
        });

        modal_DOM.spritesContainer.append(listPokemonSpritesTemplate);
    });


    clearTagContent(modal_DOM.listNumRegional);
    console.log(listDescriptions.pokedex_numbers)
    const listNumRegional = [...listDescriptions.flavor_text_entries, ...listDescriptions.pokedex_numbers].filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.pokedex === value.pokedex
        ))
    )
    .map((item) => ({...item, order: Object.keys(getRegionForName).findIndex((entry_number) => item.pokedex === entry_number)}))
    .sort((a, b) => Number(a.order) - Number(b.order));

    listDescriptions.pokedex_numbers.forEach((item) => {
        const li = document.createElement("li");
        const NumRegional = getRegionForName[item.pokedex.name] || "Unknown";
        li.textContent = ` ${item.entry_number} - ${NumRegional}`;

        modal_DOM.listNumRegional.append(li);
    });

    modal_DOM.nbNumRegional.textContent = ` (${listNumRegional.length})`;
    modal_DOM.listNumRegional.closest("details").inert = listNumRegional.length === 0;


    clearTagContent(modal_DOM.listGames);

    const listGames = [...listDescriptions.flavor_text_entries, ...pkmnExtraData.game_indices].filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.version.name === value.version.name
        ))
    )
    .map((item) => ({...item, order: Object.keys(getVersionForName).findIndex((game) => item.version.name === game)}))
    .sort((a, b) => Number(a.order) - Number(b.order));

    const gameImages = await fetchGameImages(); // Récupère les images des jeux depuis l'API

    listGames.forEach((item) => {
        const li = document.createElement("li");
        const versionName = getVersionForName[item.version.name] || "Unknown";
        
        // Vérifie si une image existe pour ce jeu
        const gameImage = gameImages.find((game) => game.version === item.version.name);

        if (gameImage) {
            // Si une image existe, affichez-la
            const img = document.createElement("img");
            img.src = `data:image/png;base64,${btoa(
                new Uint8Array(gameImage.data.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
            )}`;
            img.alt = versionName;
            img.classList.add("w-16", "h-16", "rounded-md"); // Ajoutez des classes pour le style
            li.appendChild(img);
        } else {
            li.textContent = versionName;
        }

        modal_DOM.listGames.append(li);
    });
    modal_DOM.nbGames.textContent = ` (${listGames.length})`;
    modal_DOM.listGames.closest("details").inert = listGames.length === 0;

    const listRegions = ["alola", "hisui", "galar", "paldea"];
    let listNonRegionalForms = listDescriptions.varieties?.filter((item) => !item.is_default && !listRegions.some((region) => item.pokemon.name.includes(region))) || []
    listNonRegionalForms = listNonRegionalForms.map((item) => {
        return {
            name: item?.name || item.pokemon?.name,
            sprites: {
                regular: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${getPkmnIdFromURL(item.pokemon.url)}.png`,
                artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${getPkmnIdFromURL(item.pokemon.url)}.png`,
            }
        }
    });
    clearTagContent(modal_DOM.listForms);
    modal_DOM.nbForms.textContent = ` (${listNonRegionalForms?.length || 0})`;

    listNonRegionalForms.forEach((item) => {
        const clone = document.importNode(
            pokemonSpriteTemplateRaw.content,
            true
        );

        const img = clone.querySelector("img");
        img.alt = `Sprite de ${item.name}`;
        img.classList.replace("w-52", "w-36");
        replaceImage(img, item.sprites.regular, () => {
            replaceImage(img, item.sprites.artwork);
        });

        const textContainer = clone.querySelector("p");
        const separator = `${item.name.split(pkmnData.name.en.toLowerCase()).at(-1)}`.substring(1)
        if(formsNameDict[separator]) {
            const prefix =  formsNameDict[separator].displayPkmnName ? `${pkmnData.name.fr} ` : "";
            textContainer.textContent = `${prefix}${formsNameDict[separator].name}`;
        } else {
            textContainer.textContent = item.name;
        }

        modal_DOM.listForms.append(clone);
    });
    modal_DOM.listForms.closest("details").inert = listNonRegionalForms.length === 0;

    clearTagContent(modal_DOM.listRegionalForms);
    modal_DOM.nbRegionalForms.textContent = ` (${pkmnData.formes?.length || 0})`;

    for (const item of pkmnData?.formes || []) {
        const pkmnForm = await fetchPokemon(pkmnData.pokedex_id, item.region);
        const clone = createAlternateForm(
            document.importNode(pkmnTemplateRaw.content, true),
            {...item, ...pkmnData, ...pkmnForm, sprite: pkmnForm.sprites.regular, varieties: listDescriptions.varieties},
            loadDetailsModal
        );

        modal_DOM.listRegionalForms.append(clone);
    }

    modal_DOM.listRegionalForms.closest("details").inert = (pkmnData?.formes || []).length === 0;

    clearTagContent(modal_DOM.statistics);

    let statsTotal = 0;
    pkmnExtraData.stats.forEach((item) => {
        const clone = document.importNode(
            pokemonStatisticTempalteRaw.content,
            true
        );

        const { bar, name, value } = createStatisticEntry(clone, {...item, statistics})

        modal_DOM.statistics.append(name);
        modal_DOM.statistics.append(value);
        modal_DOM.statistics.append(bar);

        statsTotal += item.base_stat;
    })

    const totalStatEntryRow = document.importNode(
        pokemonStatisticTempalteRaw.content,
        true
    );
    const statName = totalStatEntryRow.querySelector("[data-stat-name]");
    const statValue = totalStatEntryRow.querySelector("[data-stat-value]");
    statName.textContent = "Total";
    statName.style.borderTop = "2px solid black";
    statName.style.marginTop = "1.75rem";
    statName.setAttribute("aria-label", `Total statistique de ${pkmnData.name.fr} : ${statsTotal}`);
    statName.style.borderLeftWidth = "0";

    statValue.textContent = statsTotal;
    statValue.style.borderTop = "2px solid black";
    statValue.classList.add("sm:col-span-2");
    statValue.classList.remove("text-right");
    statValue.style.marginTop = "1.75rem";
    statValue.style.borderRightWidth = "0";

    modal_DOM.statistics.append(statName);
    modal_DOM.statistics.append(statValue);

    // Afficher les cartes TCG
    clearTagContent(modal_DOM.tcgCards);
    const tcgCards = dataCache[pkmnId]?.tcgCards || [];
    console.log(`Affichage des cartes TCG pour ${pkmnData.name.fr}:`, tcgCards);
    
    // Créer l'élément details pour les cartes TCG
    const tcgDetails = document.createElement("details");
    tcgDetails.className = "mt-3";
    
    // Créer le summary
    const tcgSummary = document.createElement("summary");
    tcgSummary.className = "hocus:marker:text-(color:--bg-modal-color) font-bold text-xl";
    tcgSummary.textContent = `Cartes TCG (${tcgCards.length})`;
    
    // Créer le conteneur pour les cartes
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-70";
    
    if (tcgCards.length > 0) {
        tcgCards.forEach(card => {
            try {
                console.log("Données de la carte:", card);
                const cardElement = document.createElement("div");
                cardElement.className = "flex flex-col items-center p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white w-[280px] mx-auto mb-8";
                
                const img = document.createElement("img");
                img.className = "w-full h-auto rounded-lg min-w-[180px] min-h-[180px] object-contain";
                console.log("URL de l'image:", card.image);
                
                if (card.image) {
                    img.src = card.image;
                    img.alt = card.name;
                } else {
                    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%236b7280'%3ECarte non disponible%3C/text%3E%3C/svg%3E";
                    img.alt = "Image non disponible";
                }
                
                const name = document.createElement("p");
                name.textContent = card.name;
                name.className = "mt-6 font-medium text-center text-lg";
                
                const setName = document.createElement("p");
                setName.textContent = card.set?.name || "Set inconnu";
                setName.className = "text-base text-gray-500 text-center mt-3";
                
                cardElement.appendChild(img);
                cardElement.appendChild(name);
                cardElement.appendChild(setName);
                
                cardElement.addEventListener("click", async () => {
                    try {
                        console.log(`Chargement des détails pour la carte ${card.id}...`);
                        const cardDetails = await fetchCardDetails(card.id);
                        console.log(`Détails de la carte ${card.id}:`, cardDetails);
                        if (cardDetails) {
                            alert(`Détails de la carte:\nNom: ${cardDetails.name}\nSet: ${cardDetails.set?.name || "Inconnu"}\nNuméro: ${cardDetails.number || "N/A"}\nRareté: ${cardDetails.rarity || "N/A"}`);
                        } else {
                            alert("Impossible de charger les détails de la carte.");
                        }
                    } catch (error) {
                        console.error(`Erreur lors du chargement des détails de la carte ${card.id}:`, error);
                        alert("Impossible de charger les détails de la carte. Veuillez réessayer plus tard.");
                    }
                });
                
                cardsContainer.appendChild(cardElement);
            } catch (error) {
                console.error(`Erreur lors de l'affichage de la carte ${card.name}:`, error);
            }
        });
    } else {
        console.log(`Aucune carte TCG trouvée pour ${pkmnData.name.fr}`);
    }
    
    tcgDetails.appendChild(tcgSummary);
    tcgDetails.appendChild(cardsContainer);
    modal_DOM.tcgCards.appendChild(tcgDetails);

    console.log("Current Pokemon's data", pkmnData);

    loadGenerationBtn.inert = hasReachPokedexEnd;

    clearTagContent(modal_DOM.listSiblings);
    generatePokemonSiblingsUI(pkmnData);
    
    // Ajouter le lien vers Poképedia
    const footerContainer = modal.querySelector('footer.modal-footer div');
    const closeButton = modal.querySelector('[data-close-modal]');
    
    // Supprimer le lien existant s'il y en a un
    const existingPokedexLink = modal.querySelector('[data-pokedex-link]');
    if (existingPokedexLink) {
        existingPokedexLink.remove();
    }
    
    // Formater le nom pour l'URL (minuscules, sans accents, remplacer espaces par des tirets)
    const formatNameForUrl = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    };
    
    const pokedexUrl = `https://www.pokepedia.fr/${formatNameForUrl(pkmnData.name.fr)}`;
    
    // Créer le lien
    const pokedexLink = document.createElement('a');
    pokedexLink.href = pokedexUrl;
    pokedexLink.target = "_blank";
    pokedexLink.rel = "noopener noreferrer";
    pokedexLink.className = "block rounded-md transition-colors text-center w-full mt-2 mb-2 p-2 border border-solid border-blue-600 bg-blue-100 text-blue-800 hocus:bg-blue-600 hocus:text-white ease-out";
    pokedexLink.textContent = `Voir ${pkmnData.name.fr} sur Poképedia`;
    pokedexLink.setAttribute('data-pokedex-link', '');
    pokedexLink.setAttribute('data-testid', 'pokedex-link');
    
    // Insérer le lien avant le bouton de fermeture
    if (footerContainer && closeButton) {
        footerContainer.insertBefore(pokedexLink, closeButton);
    }
    
    modal.inert = false;
    modal.setAttribute("aria-busy", false);

    // Initialiser le visualiseur sonore
    initWaveform();

    // Charger le cri du Pokémon
    if (pkmnExtraData.cries?.latest) {
        wavesurfer.load(pkmnExtraData.cries.latest);
    }
};

window.addEventListener("pokedexLoaded", () => {
    if(!modal.open) {
        return;
    }

    const pkmnData = JSON.parse(modal.dataset.pokemonData);
    clearTagContent(modal_DOM.listSiblings);
    generatePokemonSiblingsUI(pkmnData);
});

export { loadDetailsModal }
export default displayModal;
