// Constants
const STORAGE_KEY = 'favorite_quotes';
const API_URL = 'https://api.quotable.io/random';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CACHE_KEY = 'cached_quote';
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

// State management
let favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

async function fetchQuoteWithRetry(retryCount = 0, forceRefresh = false) {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');
    const buttonElement = document.querySelector('button');

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

        if (cachedData && cachedTime && Date.now() - cachedTime < CACHE_EXPIRY) {
            // Use cached quote immediately without animation
            const data = JSON.parse(cachedData);
            updateQuoteDisplay(data);
            return;
        }
    }

    try {
        // Existing loading state setup
        quoteElement.classList.add('loading');
        authorElement.classList.add('loading');
        buttonElement.disabled = true;

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now());

        // Animate new quote transition
        animateQuoteTransition(data);
        
    } catch (error) {
        // Existing error handling
    }
}

// New helper functions
function updateQuoteDisplay(data) {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');
    const favoriteButton = document.getElementById('favorite-button');

    quoteElement.innerText = `"${data.content}"`;
    authorElement.innerText = `- ${data.author}`;
    quoteElement.style.opacity = 1;
    authorElement.style.opacity = 1;

    const isFavorite = favorites.some(q => q.content === data.content);
    favoriteButton.innerHTML = isFavorite ? '❤️' : '🤍';
    favoriteButton.onclick = () => toggleFavorite(data);
}

function animateQuoteTransition(data) {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');
    const buttonElement = document.querySelector('button');

    quoteElement.style.opacity = 0;
    authorElement.style.opacity = 0;

    setTimeout(() => {
        updateQuoteDisplay(data);
        quoteElement.classList.remove('loading');
        authorElement.classList.remove('loading');
        buttonElement.disabled = false;
    }, 500);
}

window.onload = () => {
    fetchQuoteWithRetry();
    updateFavoritesList();
};

function toggleFavorite(quote) {
    const favoriteButton = document.getElementById('favorite-button');
    const index = favorites.findIndex(q => q.content === quote.content);
    
    if (index === -1) {
        favorites.push(quote);
        favoriteButton.innerHTML = '❤️';
    } else {
        favorites.splice(index, 1);
        favoriteButton.innerHTML = '🤍';
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    updateFavoritesList();
}

function updateFavoritesList() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    
    favorites.forEach((quote, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="favorite-quote">
                <div class="favorite-quote-content">
                    <p>"${quote.content}"</p>
                    <p class="author">- ${quote.author}</p>
                </div>
                <div class="quote-buttons">
                    <button class="share-button" onclick="shareQuote('${quote.content}', '${quote.author}')">
                        Share 📤
                    </button>
                    <button class="delete-button" onclick="deleteFavorite(${index})">
                        Delete ❌
                    </button>
                </div>
            </div>
        `;
        favoritesList.appendChild(li);
    });
}
function deleteFavorite(index) {
    if (confirm('Are you sure you want to delete this quote?')) {
        favorites.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        updateFavoritesList();
        
        // Update favorite button if the current quote is being deleted
        const currentQuote = document.getElementById('quote').innerText.replace(/[""]/g, '');
        const favoriteButton = document.getElementById('favorite-button');
        if (!favorites.some(q => q.content === currentQuote)) {
            favoriteButton.innerHTML = '🤍';
        }
    }
}

async function shareQuote(content, author) {
    const shareData = {
        title: 'Daily Quote',
        text: `"${content}" - ${author}`,
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
            alert('Quote copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing quote:', error);
    }
}

// Initialize on page load
window.onload = () => {
    fetchQuote();
    updateFavoritesList();
};