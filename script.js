let pokemonData = [];
const HISTORY_SIZE = 8; 
const history = [];

// --- Data Loading Function ---
// This runs immediately when the script loads (but after the HTML thanks to 'defer')
async function loadPokemonData() {
    try {
        const response = await fetch('pokemon_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        pokemonData = await response.json();
        // Update status display
        const loadStatusElement = document.getElementById('load-status');
        if (loadStatusElement) {
             loadStatusElement.textContent = `Pokémon Data Loaded! Total: ${pokemonData.length} entries.`;
             loadStatusElement.style.color = 'darkgreen';
        }
       
    } catch (e) {
        console.error('Failed to load Pokémon data:', e);
        const loadStatusElement = document.getElementById('load-status');
        if (loadStatusElement) {
            loadStatusElement.textContent = 'ERROR: Failed to load pokemon_data.json. Check file path.';
            loadStatusElement.style.color = 'red';
        }
    }
}

// Call the loading function when the script file executes
loadPokemonData();

// --- Utility Functions ---

function generateMoveTable(moves) {
    let html = '<h3>Known Moves</h3><table class="move-table"><thead><tr><th>Move</th><th>Power (DMG)</th><th>Accuracy (ACC)</th><th>Heal (HP)</th></tr></thead><tbody>';
    
    moves.forEach(move => {
        const [name, power, acc, health] = move;
        const powerDisplay = power > 0 ? power : 'N/A';
        const healthDisplay = health > 0 ? health + '%' : 'N/A';
        const accDisplay = acc !== 0 ? acc : '—';

        html += `<tr><td>${name}</td><td>${powerDisplay}</td><td>${accDisplay}</td><td>${healthDisplay}</td></tr>`;
    });

    html += '</tbody></table>';
    return html;
}

function generateStatsTable(stats) {
    if (!stats) return '';
    let html = '<h3>Base Stats</h3><table class="stats-table">';
    
    // Header Row
    html += '<tr><td>HP</td><td>ATK</td><td>DEF</td><td>SPA</td><td>SPD</td><td>SPE</td></tr>';
    
    // Data Row
    html += `<tr><td>${stats.hp}</td><td>${stats.atk}</td><td>${stats.def}</td><td>${stats.spa}</td><td>${stats.spd}</td><td>${stats.spe}</td></tr>`;
    
    html += '</table>';
    return html;
}

// --- Core Generator Function ---

function getRandomPokemon() {
    if (pokemonData.length === 0) {
        alert('Pokémon data is not yet loaded or failed to load. Please wait for the "Data Loaded" message.');
        return;
    }

    const occasionFilter = document.getElementById('occasion-select').value;
    const typeFilter = document.getElementById('type-select').value;
    const evolutionFilter = document.getElementById('evolution-select').value;
    const includeLegendary = document.getElementById('include-legendary').checked;
    const includeUltraBeast = document.getElementById('include-ultrabeast').checked;
    const resultBox = document.getElementById('result-box');
    
    // Shiny Roll (1 in 100)
    const isShiny = Math.floor(Math.random() * 100) === 0;

    const filteredList = pokemonData.filter(p => {
        const isLegendary = p.category === 'Legendary' || p.category === 'Mythical';
        const isUltraBeast = p.category === 'Ultra Beast';
        
        if (isLegendary && !includeLegendary) return false;
        if (isUltraBeast && !includeUltraBeast) return false;

        // Apply habitat and evolution filters only to 'Standard' Pokémon
        const isStandardEvolutionLine = p.evolution === 'lowest' || p.evolution === 'middle' || p.evolution === 'highest';

        if ((p.category === 'Standard' || isStandardEvolutionLine) && (p.category !== 'Legendary' && p.category !== 'Ultra Beast')) {
            if (occasionFilter !== 'all' && p.habitat !== occasionFilter) return false;
            if (evolutionFilter !== 'all' && p.evolution !== evolutionFilter) return false;
        }
        
        if (typeFilter !== 'all' && !p.types.includes(typeFilter)) return false;

        return true;
    });

    let availablePokemon = filteredList.filter(p => !history.includes(p.name));

    const resultName = document.getElementById('pokemon-name');
    const movesListElement = document.getElementById('moves-list');
    const historyStatus = document.getElementById('history-status');
    const categoryInfo = document.getElementById('pokemon-category-info');

    if (filteredList.length === 0) {
        resultName.textContent = "No Pokémon available with current filters.";
        categoryInfo.textContent = "Try adjusting your filters!";
        movesListElement.innerHTML = '';
        historyStatus.textContent = "History tracking is paused.";
        resultBox.classList.remove('shiny-background');
        return;
    }

    if (availablePokemon.length === 0) {
        availablePokemon = filteredList;
        history.length = 0; 
        console.log("History reset to allow for a new selection.");
    }

    const randomIndex = Math.floor(Math.random() * availablePokemon.length);
    const selectedPokemon = availablePokemon[randomIndex];

    // Apply Shiny Styling
    if (isShiny) {
        resultName.innerHTML = `${selectedPokemon.name} <span class="shiny-label">(Shiny) ✨</span>`;
        resultBox.classList.add('shiny-background');
    } else {
        resultName.textContent = selectedPokemon.name;
        resultBox.classList.remove('shiny-background');
    }

    // Update display 
    categoryInfo.innerHTML = `Category: ${selectedPokemon.category} | Types: ${selectedPokemon.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} | Evolution Stage: ${selectedPokemon.evolution.charAt(0).toUpperCase() + selectedPokemon.evolution.slice(1)}`;
    
    // Combine Stats and Moves tables
    movesListElement.innerHTML = generateStatsTable(selectedPokemon.stats) + generateMoveTable(selectedPokemon.moves);

    // Update history
    history.push(selectedPokemon.name);
    if (history.length > HISTORY_SIZE) {
        history.shift(); 
    }
    
    historyStatus.textContent = `Last ${history.length} selections (No Repetition): ${history.join(', ')}`;
}

// --- Entire List View Logic ---

function generateFullListContent() {
    if (pokemonData.length === 0) {
        document.getElementById('full-list-content').innerHTML = '<p>Pokémon data is not yet loaded.</p>';
        return;
    }

    const listContainer = document.getElementById('full-list-content');
    listContainer.innerHTML = ''; 

    const sortedData = [...pokemonData].sort((a, b) => a.name.localeCompare(b.name));

    sortedData.forEach(p => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        
        const nameEl = document.createElement('div');
        nameEl.className = 'card-name';
        nameEl.textContent = p.name;
        
        const detailsEl = document.createElement('div');
        detailsEl.className = 'card-details';
        detailsEl.innerHTML = `
            Category: ${p.category} | 
            Evolution: ${p.evolution.charAt(0).toUpperCase() + p.evolution.slice(1)} | 
            Types: ${p.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} |
            Habitat: ${p.habitat.charAt(0).toUpperCase() + p.habitat.slice(1)}
        `;

        card.appendChild(nameEl);
        card.appendChild(detailsEl);
        card.innerHTML += generateStatsTable(p.stats);
        card.innerHTML += generateMoveTable(p.moves);
        
        listContainer.appendChild(card);
    });
}

function toggleListView() {
    const mainView = document.getElementById('main-view');
    const listView = document.getElementById('list-view');

    if (mainView.style.display !== 'none') {
        generateFullListContent(); 
        mainView.style.display = 'none';
        listView.style.display = 'block';
    } else {
        listView.style.display = 'none';
        mainView.style.display = 'block';
    }
}
