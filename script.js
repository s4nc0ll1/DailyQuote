// Constants
const STORAGE_KEY = 'favorite_quotes';

// State management
let favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

async function fetchQuote() {
    const quoteElement = document.getElementById('quote');
    const authorElement = document.getElementById('author');
    const buttonElement = document.querySelector('button');
    
    try {
        // Show loading state
        quoteElement.classList.add('loading');
        authorElement.classList.add('loading');
        buttonElement.disabled = true;
        
        const response = await fetch('https://api.quotable.io/random');
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
        quoteElement.innerText = 'An error occurred. Please try again later.';
        quoteElement.classList.remove('loading');
        authorElement.classList.remove('loading');
        buttonElement.disabled = false;
    }
}

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