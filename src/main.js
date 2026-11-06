
import './style.css';

// PAGE ELEMENTS
const homeView = document.querySelector('#home-view');
const searchView = document.querySelector('#search-view');

const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');

const resultsGrid = document.querySelector('#results-grid');
const libraryGrid = document.querySelector('#library-grid');

const searchMessage = document.querySelector('#search-message');
const resultsHeading = document.querySelector('#results-heading');
const resultsCount = document.querySelector('#results-count');
const resultsSummary = document.querySelector('#results-summary');
const libraryCount = document.querySelector('#library-count');
const emptyLibrary = document.querySelector('#empty-library');

// Load saved shows from browser storage.
const STORAGE_KEY = 'synopsis-library';

function loadLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let library = loadLibrary();
let searchResults = [];

// TVMAZE API
async function searchTVShows(query) {
  const url =
    'https://api.tvmaze.com/search/shows?q=' +
    encodeURIComponent(query);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('TVmaze request failed');
  }

  const data = await response.json();
  return data.map(result => result.show);
}

// SAVE LIBRARY
function saveLibrary() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function isSaved(id) {
  return library.some(show => show.id === id);
}

// ADD AND REMOVE SHOWS
function addShow(show) {
  if (isSaved(show.id)) return;

  library.push({
    id: show.id,
    name: show.name,
    premiered: show.premiered,
    image: show.image
  });

  saveLibrary();
  renderLibrary();
  renderResults();
}

function removeShow(id) {
  library = library.filter(show => show.id !== id);

  saveLibrary();
  renderLibrary();
  renderResults();
}

// CREATE A SHOW CARD
function createShowCard(show, inLibrary = false) {
  const card = document.createElement('article');
  card.className = 'show-card';

  // Poster from TVmaze, not Figma.
  if (show.image?.medium) {
    const img = document.createElement('img');
    img.src = show.image.medium;
    img.alt = `${show.name} poster`;
    img.loading = 'lazy';
    card.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'poster-placeholder';
    placeholder.textContent = 'No poster available';
    card.appendChild(placeholder);
  }

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.textContent = show.name;

  const year = document.createElement('p');
  year.textContent = show.premiered
    ? show.premiered.slice(0, 4)
    : 'Year unavailable';

  content.appendChild(title);
  content.appendChild(year);

  const button = document.createElement('button');

  if (inLibrary) {
    button.textContent = 'Remove from Library';
    button.addEventListener('click', () => {
      removeShow(show.id);
    });
  } else if (isSaved(show.id)) {
    button.textContent = '✓ Added';
    button.classList.add('added');
    button.disabled = true;
  } else {
    button.textContent = '+ Add to Library';
    button.addEventListener('click', () => {
      addShow(show);
    });
  }

  content.appendChild(button);
  card.appendChild(content);

  return card;
}

// RENDER THE LIBRARY
function renderLibrary() {
  libraryGrid.replaceChildren();
  libraryCount.textContent = library.length;

  const isEmpty = library.length === 0;

  emptyLibrary.hidden = !isEmpty;
  libraryGrid.hidden = isEmpty;

  for (const show of library) {
    libraryGrid.appendChild(createShowCard(show, true));
  }
}

// RENDER SEARCH RESULTS
function renderResults() {
  resultsGrid.replaceChildren();
  resultsCount.textContent = searchResults.length;

  const savedCount = searchResults.filter(show =>
    isSaved(show.id)
  ).length;

  resultsSummary.textContent =
    `${searchResults.length} results · ` +
    `${savedCount} already in your library`;

  for (const show of searchResults) {
    resultsGrid.appendChild(createShowCard(show));
  }
}

// SWITCH BETWEEN THE TWO VIEWS
function showHome() {
  searchView.hidden = true;
  homeView.hidden = false;
}

function showSearch() {
  homeView.hidden = true;
  searchView.hidden = false;
}

// SEARCH FORM
searchForm.addEventListener('submit', async event => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  showSearch();

  resultsHeading.textContent = `Search results for "${query}"`;
  searchMessage.textContent = 'Searching...';

  searchResults = [];
  renderResults();

  try {
    searchResults = await searchTVShows(query);
    renderResults();

    searchMessage.textContent = searchResults.length
      ? ''
      : 'No shows found. Try another search.';
  } catch (error) {
    console.error(error);
    searchMessage.textContent =
      'Something went wrong. Please try again.';
  }
});

// NAVIGATION
document.querySelector('#home-link')
  .addEventListener('click', event => {
    event.preventDefault();
    showHome();
  });

document.querySelector('#library-link')
  .addEventListener('click', event => {
    event.preventDefault();
    showHome();
  });

document.querySelector('#find-show-button')
  .addEventListener('click', () => {
    searchInput.focus();
  });

document.querySelector('#empty-find-button')
  .addEventListener('click', () => {
    searchInput.focus();
  });

// INITIAL PAGE
renderLibrary();
showHome();
