const DATA_URL = './data/houses.json';

const listingsNode = document.querySelector('#listings');
const emptyStateNode = document.querySelector('#empty-state');
const countNode = document.querySelector('#result-count');
const updatedNode = document.querySelector('#last-updated');
const searchInput = document.querySelector('#search-input');

let houses = [];

function euro(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Prijs onbekend';
  }

  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function render(items) {
  listingsNode.innerHTML = '';
  countNode.textContent = `${items.length} woningen`;

  if (!items.length) {
    emptyStateNode.classList.remove('hidden');
    return;
  }

  emptyStateNode.classList.add('hidden');

  const fragment = document.createDocumentFragment();

  for (const house of items) {
    const card = document.createElement('article');
    card.className = 'card';

    const imageUrl = house.thumbnail || 'https://via.placeholder.com/640x480?text=Geen+foto';
    const location = [house.location, house.country].filter(Boolean).join(', ');

    card.innerHTML = `
      <img src="${imageUrl}" alt="${house.title}" loading="lazy" />
      <div class="card-content">
        <h3>${house.title}</h3>
        <p class="price">${euro(house.priceEur)}</p>
        <p class="meta">${location || 'Locatie onbekend'}</p>
        <p class="description">${house.description || 'Geen omschrijving beschikbaar.'}</p>
        <p class="meta">Bron: ${house.source} (${house.sourceDomain})</p>
        <a class="source-link" href="${house.url}" target="_blank" rel="noopener noreferrer">Bekijk op bronwebsite</a>
      </div>
    `;

    fragment.append(card);
  }

  listingsNode.append(fragment);
}

function filterHouses(query) {
  const term = query.trim().toLowerCase();

  if (!term) {
    render(houses);
    return;
  }

  const filtered = houses.filter((house) =>
    [house.title, house.description, house.location, house.country]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term))
  );

  render(filtered);
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Kon ${DATA_URL} niet laden (${response.status})`);
    }

    houses = await response.json();

    const latestScrape = houses
      .map((house) => house.scrapedAt)
      .filter(Boolean)
      .sort()
      .at(-1);

    updatedNode.textContent = latestScrape ? new Date(latestScrape).toLocaleString('nl-NL') : 'onbekend';

    render(houses);
  } catch (error) {
    listingsNode.innerHTML = `<p class="empty-state">Fout bij laden van data: ${error.message}</p>`;
  }
}

searchInput.addEventListener('input', (event) => {
  filterHouses(event.target.value);
});

init();
