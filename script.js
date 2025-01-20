// Constants
const STORAGE_KEY = 'favorite_quotes';
const API_URL = 'https://api.quotable.io/random';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// State management
let favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

async function fetchQuoteWithRetry(retryCount = 0) {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');
    const buttonElement = document.querySelector('button');
    
    try {
        // Show loading state
        quoteElement.classList.add('loading');
        authorElement.classList.add('loading');
        buttonElement.disabled = true;
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Animate quote transition
        quoteElement.style.opacity = 0;
        authorElement.style.opacity = 0;
        
        setTimeout(() => {
            quoteElement.innerText = `"${data.content}"`;
            authorElement.innerText = `- ${data.author}`;
            
            // Add favorite button
            const isFavorite = favorites.some(q => q.content === data.content);
            const favoriteButton = document.getElementById('favorite-button');
            favoriteButton.innerHTML = isFavorite ? '❤️' : '🤍';
            favoriteButton.onclick = () => toggleFavorite(data);
            
            // Fade in new quote
            quoteElement.style.opacity = 1;
            authorElement.style.opacity = 1;
            quoteElement.classList.remove('loading');
            authorElement.classList.remove('loading');
            buttonElement.disabled = false;
        }, 500);
        
    } catch (error) {
        console.error('Error fetching the quote:', error);
        
        if (retryCount < MAX_RETRIES) {
            // Show retry message
            quoteElement.innerText = `Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`;
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            
            // Retry the fetch
            return fetchQuoteWithRetry(retryCount + 1);
        } else {
            // Show specific error message based on the error type
            let errorMessage = 'An error occurred. Please try again later.';
            
            if (!navigator.onLine) {
                errorMessage = 'You appear to be offline. Please check your internet connection.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (error.message.includes('status: 5')) {
                errorMessage = 'The quote service is currently unavailable. Please try again later.';
            }
            
            quoteElement.innerText = errorMessage;
            authorElement.innerText = '';
        }
        
        quoteElement.classList.remove('loading');
        authorElement.classList.remove('loading');
        buttonElement.disabled = false;
    }
}

// Update the fetch function name in the window.onload
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