// Bookmarkr App - Main Application Logic

// State Management
let currentView = 'home';
let myBooks = [];
let myQuotes = [];
let readingActivity = {};
let currentMonth = new Date();
let currentBookForProgress = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    setupEventListeners();
    setDynamicGreeting();
    renderCurrentView();
    updateStreak();
    updateStats();
});

// Set dynamic greeting based on time of day
function setDynamicGreeting() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning 📖';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon 📖';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good evening 📖';
    } else {
        greeting = 'Good night 📖';
    }
    
    const greetingElement = document.getElementById('dynamicGreeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

// Load data from localStorage
function loadDataFromStorage() {
    const stored = localStorage.getItem('bookTrackData');
    if (stored) {
        const data = JSON.parse(stored);
        myBooks = data.books || [];
        myQuotes = data.quotes || [];
        readingActivity = data.activity || {};
    }
}

// Save data to localStorage
function saveDataToStorage() {
    const data = {
        books: myBooks,
        quotes: myQuotes,
        activity: readingActivity
    };
    localStorage.setItem('bookTrackData', JSON.stringify(data));
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Add Book Buttons
    document.getElementById('addBookBtn').addEventListener('click', openAddBookModal);
    document.getElementById('addFirstBook').addEventListener('click', openAddBookModal);

    // Add Quote Button
    document.getElementById('addQuoteBtn').addEventListener('click', openAddQuoteModal);

    // Modal Controls
    document.getElementById('closeModal').addEventListener('click', closeAddBookModal);
    document.getElementById('closeProgressModal').addEventListener('click', closeProgressModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('closeQuoteModal').addEventListener('click', closeAddQuoteModal);
    document.querySelector('#addBookModal .modal-overlay').addEventListener('click', closeAddBookModal);
    document.querySelector('#progressModal .modal-overlay').addEventListener('click', closeProgressModal);
    document.querySelector('#editBookModal .modal-overlay').addEventListener('click', closeEditModal);
    document.querySelector('#addQuoteModal .modal-overlay').addEventListener('click', closeAddQuoteModal);

    // Book Search
    document.getElementById('bookSearch').addEventListener('input', handleBookSearch);

    // Manual Add
    document.getElementById('manualAddBtn').addEventListener('click', showManualForm);
    document.getElementById('manualForm').addEventListener('submit', handleManualAdd);

    // Cover Upload Preview
    document.getElementById('bookCoverUpload').addEventListener('change', handleCoverUpload);
    document.getElementById('editBookCoverUpload').addEventListener('change', handleEditCoverUpload);

    // Edit Form
    document.getElementById('editForm').addEventListener('submit', handleEditBook);
    document.getElementById('deleteBookBtn').addEventListener('click', handleDeleteBook);

    // Progress Update
    document.getElementById('saveProgress').addEventListener('click', handleProgressUpdate);

    // Quote Form
    document.getElementById('quoteForm').addEventListener('submit', handleAddQuote);

    // Highlights Filters
    document.querySelectorAll('.highlights-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.highlights-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderHighlights(filter);
        });
    });

    // Library Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderLibrary(filter);
        });
    });

    // Genre Filters
    document.querySelectorAll('.genre-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.genre-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const genre = btn.dataset.genre;
            const statusFilter = document.querySelector('.filter-btn.active').dataset.filter;
            renderLibrary(statusFilter, genre);
        });
    });

    // Calendar Navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
}

// View Switching
function switchView(viewName) {
    currentView = viewName;
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewName + 'View').classList.add('active');

    // Render specific view
    renderCurrentView();
}

function renderCurrentView() {
    switch(currentView) {
        case 'home':
            renderHome();
            break;
        case 'library':
            renderLibrary('all');
            break;
        case 'genres':
            renderGenres();
            break;
        case 'highlights':
            renderHighlights('all');
            break;
        case 'stats':
            renderStats();
            break;
        case 'calendar':
            renderCalendar();
            break;
    }
}

// Home View
function renderHome() {
    const readingBooks = myBooks.filter(book => book.status === 'reading');
    const container = document.getElementById('currentlyReading');

    if (readingBooks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No books in progress</h3>
                <p>Start tracking your reading journey by adding a book</p>
                <button class="btn-primary" onclick="openAddBookModal()">Add Your First Book</button>
            </div>
        `;
        return;
    }

    container.innerHTML = readingBooks.map(book => {
        const progress = (book.currentPage / book.totalPages) * 100;
        const coverHtml = book.coverImage 
            ? `<img src="${book.coverImage}" alt="${book.title}">`
            : `<span class="book-cover-placeholder">${getBookEmoji(book.genre || 'Fiction')}</span>`;
        
        return `
            <div class="reading-book">
                <div class="book-cover">${coverHtml}</div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">by ${book.author}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${book.currentPage} / ${book.totalPages} pages</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="book-actions">
                        <button class="btn-small primary" onclick="openProgressModal('${book.id}')">
                            Update Progress
                        </button>
                        <button class="btn-small" onclick="openEditModal('${book.id}')">
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Library View
function renderLibrary(filter, genreFilter = 'all') {
    let filteredBooks = myBooks;

    // Filter by status
    if (filter !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.status === filter);
    }

    // Filter by genre
    if (genreFilter !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.genre === genreFilter);
    }

    const container = document.getElementById('booksGrid');

    if (filteredBooks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No books found</h3>
                <p>Add books to start building your collection</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredBooks.map(book => {
        const statusClass = book.status || 'reading';
        const statusText = {
            'reading': 'Reading',
            'finished': 'Finished',
            'want': 'Want to Read'
        }[statusClass];

        const coverHtml = book.coverImage 
            ? `<img src="${book.coverImage}" alt="${book.title}">`
            : `<span class="book-cover-placeholder">${getBookEmoji(book.genre || 'Fiction')}</span>`;

        const genreEmoji = book.genre ? getBookEmoji(book.genre) : '🏷️';
        const genreText = book.genre || 'No Genre';

        return `
            <div class="book-card" onclick="openEditModal('${book.id}')">
                <div class="book-card-cover">${coverHtml}</div>
                <h3 class="book-card-title">${book.title}</h3>
                <p class="book-card-author">by ${book.author}</p>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <span class="book-status ${statusClass}">${statusText}</span>
                    <span class="book-genre">${genreEmoji} ${genreText}</span>
                </div>
                ${book.status === 'reading' ? `
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" style="width: ${(book.currentPage / book.totalPages) * 100}%"></div>
                    </div>
                    <div class="progress-text" style="font-size: 12px;">
                        <span>${book.currentPage} / ${book.totalPages}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Genres View
function renderGenres() {
    const genres = ['Productivity', 'Psychology', 'Non-Fiction', 'Finance', 'Business', 'Philosophy', 'Fiction', 'Self-Help', 'History', "Children's"];
    const container = document.getElementById('genresGrid');
    
    container.innerHTML = genres.map(genre => {
        const genreBooks = myBooks.filter(book => book.genre === genre);
        const emoji = getBookEmoji(genre);
        
        if (genreBooks.length === 0) return '';
        
        const booksHtml = genreBooks.slice(0, 5).map(book => {
            const coverHtml = book.coverImage 
                ? `<img src="${book.coverImage}" alt="${book.title}">`
                : '';
            return `<div class="genre-book-mini">${coverHtml}</div>`;
        }).join('');
        
        return `
            <div class="genre-card" onclick="filterByGenre('${genre}')">
                <div class="genre-card-header">
                    <div class="genre-card-icon">${emoji}</div>
                    <div class="genre-card-title">${genre}</div>
                </div>
                <div class="genre-card-count">${genreBooks.length} ${genreBooks.length === 1 ? 'book' : 'books'}</div>
                <div class="genre-card-books">
                    ${booksHtml}
                </div>
            </div>
        `;
    }).filter(Boolean).join('');
    
    if (container.innerHTML === '') {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏷️</div>
                <h3>No books yet</h3>
                <p>Add books to see them organized by genre</p>
            </div>
        `;
    }
}

function filterByGenre(genre) {
    switchView('library');
    // Wait for view to switch, then apply filters
    setTimeout(() => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        
        document.querySelectorAll('.genre-filter-btn').forEach(b => b.classList.remove('active'));
        const genreBtn = document.querySelector(`.genre-filter-btn[data-genre="${genre}"]`);
        if (genreBtn) {
            genreBtn.classList.add('active');
        }
        
        renderLibrary('all', genre);
    }, 100);
}

// Stats View

// Highlights & Quotes View
function renderHighlights(filter) {
    let filteredQuotes = myQuotes;

    if (filter === 'favorites') {
        filteredQuotes = myQuotes.filter(quote => quote.isFavorite);
    }

    const container = document.getElementById('quotesGrid');

    if (filteredQuotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <h3>${filter === 'favorites' ? 'No favorite quotes yet' : 'No highlights yet'}</h3>
                <p>${filter === 'favorites' ? 'Mark quotes as favorites to see them here' : 'Start highlighting your favorite passages as you read'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredQuotes.map(quote => {
        const book = myBooks.find(b => b.id === quote.bookId);
        const bookTitle = book ? book.title : 'Unknown Book';
        const bookCover = book && book.coverImage 
            ? `<img src="${book.coverImage}" alt="${book.title}">`
            : `<span class="book-cover-placeholder">${book ? getBookEmoji(book.genre || 'Fiction') : '📖'}</span>`;
        
        return `
            <div class="quote-card">
                <div class="quote-cover">${bookCover}</div>
                <div class="quote-content">
                    <div class="quote-text">"${escapeHtml(quote.text)}"</div>
                    <div class="quote-meta">
                        <div class="quote-book-info">
                            <span class="quote-book-title">${bookTitle}</span>
                            ${quote.page ? `<span class="quote-page">• Page ${quote.page}</span>` : ''}
                        </div>
                        <div class="quote-actions">
                            <button class="quote-favorite-btn ${quote.isFavorite ? 'active' : ''}" onclick="toggleQuoteFavorite('${quote.id}')">
                                ${quote.isFavorite ? '⭐' : '☆'}
                            </button>
                            <button class="quote-delete-btn" onclick="deleteQuote('${quote.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Quote Modal Functions
function openAddQuoteModal() {
    // Populate book dropdown
    const select = document.getElementById('quoteBookSelect');
    select.innerHTML = '<option value="">Choose a book...</option>' + 
        myBooks.map(book => `<option value="${book.id}">${book.title}</option>`).join('');
    
    document.getElementById('addQuoteModal').classList.add('active');
}

function closeAddQuoteModal() {
    document.getElementById('addQuoteModal').classList.remove('active');
    document.getElementById('quoteForm').reset();
}

function handleAddQuote(e) {
    e.preventDefault();
    
    const quote = {
        id: Date.now().toString(),
        bookId: document.getElementById('quoteBookSelect').value,
        text: document.getElementById('quoteText').value,
        page: document.getElementById('quotePage').value || null,
        isFavorite: document.getElementById('quoteFavorite').checked,
        addedDate: new Date().toISOString()
    };

    myQuotes.push(quote);
    saveDataToStorage();
    closeAddQuoteModal();
    renderHighlights('all');
}

function toggleQuoteFavorite(quoteId) {
    const quote = myQuotes.find(q => q.id === quoteId);
    if (quote) {
        quote.isFavorite = !quote.isFavorite;
        saveDataToStorage();
        const currentFilter = document.querySelector('.highlights-filter-btn.active').dataset.filter;
        renderHighlights(currentFilter);
    }
}

function deleteQuote(quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
        myQuotes = myQuotes.filter(q => q.id !== quoteId);
        saveDataToStorage();
        const currentFilter = document.querySelector('.highlights-filter-btn.active').dataset.filter;
        renderHighlights(currentFilter);
    }
}
let readingChart = null;

function renderStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    let monthPages = 0;
    Object.keys(readingActivity).forEach(date => {
        const d = new Date(date);
        if (d.getMonth() === currentMonthNum && d.getFullYear() === currentYear) {
            monthPages += readingActivity[date];
        }
    });

    const yearBooks = myBooks.filter(book => {
        return book.status === 'finished' && 
               book.finishedDate && 
               new Date(book.finishedDate).getFullYear() === currentYear;
    }).length;

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let totalPages = 0;
    let daysRead = 0;
    Object.keys(readingActivity).forEach(date => {
        if (new Date(date) >= thirtyDaysAgo) {
            totalPages += readingActivity[date];
            daysRead++;
        }
    });
    const avgPages = daysRead > 0 ? Math.round(totalPages / 30) : 0;

    document.getElementById('monthPages').textContent = monthPages;
    document.getElementById('yearBooks').textContent = yearBooks;
    document.getElementById('avgPages').textContent = avgPages;

    // Render chart
    renderReadingChart();
}

function renderReadingChart() {
    const ctx = document.getElementById('readingChart');
    if (!ctx) return;

    // Calculate stats by status
    const reading = myBooks.filter(b => b.status === 'reading').length;
    const finished = myBooks.filter(b => b.status === 'finished').length;
    const wantToRead = myBooks.filter(b => b.status === 'want').length;
    const total = reading + finished + wantToRead;

    // If no books, show empty state
    if (total === 0) {
        if (readingChart) {
            readingChart.destroy();
            readingChart = null;
        }
        document.getElementById('chartLegend').innerHTML = '<div class="empty-state-small">Add books to see your reading breakdown</div>';
        return;
    }

    const data = {
        labels: ['Currently Reading', 'Finished', 'Want to Read'],
        datasets: [{
            data: [reading, finished, wantToRead],
            backgroundColor: [
                '#3b82f6', // Blue for reading
                '#10b981', // Green for finished
                '#f59e0b'  // Amber for want to read
            ],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            onHover: (event, activeElements) => {
                // When hovering on chart, highlight corresponding legend item
                document.querySelectorAll('.chart-legend-item').forEach(item => {
                    item.classList.remove('highlight');
                });
                
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const legendItem = document.querySelector(`.chart-legend-item[data-index="${index}"]`);
                    if (legendItem) {
                        legendItem.classList.add('highlight');
                    }
                }
            }
        }
    };

    // Destroy previous chart if exists
    if (readingChart) {
        readingChart.destroy();
    }

    readingChart = new Chart(ctx, config);

    // Create custom legend
    const legendHtml = `
        <div class="chart-legend-item" data-index="0">
            <div class="chart-legend-color" style="background: #3b82f6;"></div>
            <div class="chart-legend-info">
                <div class="chart-legend-label">Currently Reading</div>
                <div class="chart-legend-value">${reading} ${reading === 1 ? 'book' : 'books'} (${((reading/total)*100).toFixed(1)}%)</div>
            </div>
        </div>
        <div class="chart-legend-item" data-index="1">
            <div class="chart-legend-color" style="background: #10b981;"></div>
            <div class="chart-legend-info">
                <div class="chart-legend-label">Finished</div>
                <div class="chart-legend-value">${finished} ${finished === 1 ? 'book' : 'books'} (${((finished/total)*100).toFixed(1)}%)</div>
            </div>
        </div>
        <div class="chart-legend-item" data-index="2">
            <div class="chart-legend-color" style="background: #f59e0b;"></div>
            <div class="chart-legend-info">
                <div class="chart-legend-label">Want to Read</div>
                <div class="chart-legend-value">${wantToRead} ${wantToRead === 1 ? 'book' : 'books'} (${((wantToRead/total)*100).toFixed(1)}%)</div>
            </div>
        </div>
    `;
    
    document.getElementById('chartLegend').innerHTML = legendHtml;
    
    // Add hover interaction between chart and legend
    document.querySelectorAll('.chart-legend-item').forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            // Highlight the corresponding chart segment
            readingChart.setActiveElements([{datasetIndex: 0, index: index}]);
            readingChart.update();
            item.classList.add('highlight');
        });
        
        item.addEventListener('mouseleave', () => {
            readingChart.setActiveElements([]);
            readingChart.update();
            item.classList.remove('highlight');
        });
    });
}

// Calendar View
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('calendarMonth').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const container = document.getElementById('calendarGrid');
    let html = '';

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day" style="background: transparent;"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const pages = readingActivity[date] || 0;
        
        let classes = 'calendar-day';
        if (pages > 0) {
            classes += ' has-reading';
            if (pages >= 50 && pages < 100) classes += ' level-2';
            if (pages >= 100) classes += ' level-3';
        }
        
        if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
            classes += ' today';
        }

        html += `<div class="${classes}" onclick="showDayDetails('${date}')" title="${pages > 0 ? pages + ' pages read' : 'No reading'}">${day}</div>`;
    }

    container.innerHTML = html;
}

// Show day details modal
function showDayDetails(dateStr) {
    const pages = readingActivity[dateStr];
    if (!pages) {
        alert('No reading activity on this day');
        return;
    }

    // Find books that were read on this day
    const booksReadThatDay = myBooks.filter(book => {
        return book.readingDays && book.readingDays[dateStr];
    });

    const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    let content = formattedDate + '\n\nTotal: ' + pages + ' pages\n';
    
    if (booksReadThatDay.length > 0) {
        content += '\n';
        booksReadThatDay.forEach(book => {
            const pagesRead = book.readingDays[dateStr];
            content += '\n' + book.title + '\n' + pagesRead + ' pages\n';
        });
    }

    alert(content);
}

// Streak Calculation
function updateStreak() {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (readingActivity[dateStr]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    document.getElementById('streakCount').textContent = streak;
}

// Update Stats
function updateStats() {
    document.getElementById('totalBooks').textContent = myBooks.length;
    document.getElementById('finishedBooks').textContent = 
        myBooks.filter(b => b.status === 'finished').length;
    
    let totalPagesRead = 0;
    myBooks.forEach(book => {
        if (book.status === 'finished') {
            totalPagesRead += book.totalPages;
        } else if (book.status === 'reading') {
            totalPagesRead += book.currentPage;
        }
    });
    document.getElementById('totalPages').textContent = totalPagesRead;
}

// Modal Functions
function openAddBookModal() {
    document.getElementById('addBookModal').classList.add('active');
    document.getElementById('bookSearch').focus();
}

function closeAddBookModal() {
    document.getElementById('addBookModal').classList.remove('active');
    document.getElementById('bookSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('manualForm').classList.add('hidden');
    document.getElementById('coverPreview').style.display = 'none';
    window.tempCoverImage = null;
}

function openProgressModal(bookId) {
    const book = myBooks.find(b => b.id === bookId);
    if (!book) return;

    currentBookForProgress = book;
    document.getElementById('progressBookTitle').textContent = book.title;
    document.getElementById('currentProgressDisplay').innerHTML = `
        <h3>${book.currentPage} / ${book.totalPages} pages</h3>
        <p>${Math.round((book.currentPage / book.totalPages) * 100)}% complete</p>
    `;
    document.getElementById('updatePage').value = book.currentPage;
    document.getElementById('updatePage').max = book.totalPages;
    document.getElementById('progressModal').classList.add('active');
}

function closeProgressModal() {
    document.getElementById('progressModal').classList.remove('active');
    currentBookForProgress = null;
}

// Book Search with Google Books API
async function handleBookSearch(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = '<div class="search-result">Searching millions of books...</div>';
    resultsContainer.classList.add('active');

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=AIzaSyDOHUb89V3r5N3QWnqALCmW6TlI7VD_urc`
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result">No books found</div>';
            return;
        }

        resultsContainer.innerHTML = data.items.map(item => {
            const book = item.volumeInfo;
            const title = book.title || 'Unknown Title';
            const authors = book.authors ? book.authors.join(', ') : 'Unknown Author';
            const pages = book.pageCount || 0;
            const thumbnail = book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '';
            
            return `
                <div class="search-result" onclick='addBookFromAPI(${JSON.stringify({
                    title: title,
                    author: authors,
                    pages: pages,
                    coverImage: thumbnail
                })})'>
                    ${thumbnail ? `<img src="${thumbnail}" class="result-thumbnail">` : ''}
                    <div class="result-info">
                        <div class="result-title">${escapeHtml(title)}</div>
                        <div class="result-author">by ${escapeHtml(authors)}</div>
                        <div class="result-pages">${pages > 0 ? pages + ' pages' : 'Page count unavailable'}</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        resultsContainer.innerHTML = '<div class="search-result">Error searching books. Please try again.</div>';
        console.error('Book search error:', error);
    }
}

function addBookFromAPI(bookData) {
    const book = {
        id: Date.now().toString(),
        title: bookData.title,
        author: bookData.author,
        totalPages: bookData.pages || 200,
        currentPage: 0,
        status: 'reading',
        addedDate: new Date().toISOString(),
        genre: null,
        coverImage: bookData.coverImage || null,
        readingDays: {}
    };

    myBooks.push(book);
    saveDataToStorage();
    closeAddBookModal();
    updateStats();
    renderCurrentView();
}

function showManualForm() {
    document.getElementById('manualForm').classList.remove('hidden');
}

function handleManualAdd(e) {
    e.preventDefault();
    
    const book = {
        id: Date.now().toString(),
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        totalPages: parseInt(document.getElementById('bookPages').value),
        currentPage: parseInt(document.getElementById('currentPage').value),
        status: document.getElementById('bookStatus').value,
        addedDate: new Date().toISOString(),
        genre: document.getElementById('bookGenre').value,
        coverImage: window.tempCoverImage || null,
        readingDays: {}
    };

    myBooks.push(book);
    saveDataToStorage();
    closeAddBookModal();
    updateStats();
    renderCurrentView();
    
    window.tempCoverImage = null;
}

// Cover Upload Handling
function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        window.tempCoverImage = event.target.result;
        const preview = document.getElementById('coverPreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Cover preview">`;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function handleEditCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        window.tempEditCoverImage = event.target.result;
        const preview = document.getElementById('editCoverPreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Cover preview">`;
    };
    reader.readAsDataURL(file);
}

// Edit Modal
let currentEditBook = null;

function openEditModal(bookId) {
    const book = myBooks.find(b => b.id === bookId);
    if (!book) return;

    currentEditBook = book;
    window.tempEditCoverImage = null;

    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookPages').value = book.totalPages;
    document.getElementById('editCurrentPage').value = book.currentPage;
    document.getElementById('editCurrentPage').max = book.totalPages;
    document.getElementById('editBookStatus').value = book.status;
    document.getElementById('editBookGenre').value = book.genre || '';

    const preview = document.getElementById('editCoverPreview');
    if (book.coverImage) {
        preview.innerHTML = `<img src="${book.coverImage}" alt="${book.title}">`;
    } else {
        preview.innerHTML = '';
    }

    document.getElementById('editBookModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editBookModal').classList.remove('active');
    currentEditBook = null;
    window.tempEditCoverImage = null;
}

function handleEditBook(e) {
    e.preventDefault();
    if (!currentEditBook) return;

    const oldPage = currentEditBook.currentPage;
    const newPage = parseInt(document.getElementById('editCurrentPage').value);
    const pagesRead = newPage - oldPage;

    if (pagesRead > 0) {
        const today = new Date().toISOString().split('T')[0];
        readingActivity[today] = (readingActivity[today] || 0) + pagesRead;
        
        // Track which book was read
        if (!currentEditBook.readingDays) currentEditBook.readingDays = {};
        currentEditBook.readingDays[today] = (currentEditBook.readingDays[today] || 0) + pagesRead;
    }

    currentEditBook.title = document.getElementById('editBookTitle').value;
    currentEditBook.author = document.getElementById('editBookAuthor').value;
    currentEditBook.totalPages = parseInt(document.getElementById('editBookPages').value);
    currentEditBook.currentPage = newPage;
    currentEditBook.status = document.getElementById('editBookStatus').value;
    const selectedGenre = document.getElementById('editBookGenre').value;
    currentEditBook.genre = selectedGenre || null;

    if (window.tempEditCoverImage) {
        currentEditBook.coverImage = window.tempEditCoverImage;
    }

    if (newPage >= currentEditBook.totalPages) {
        currentEditBook.status = 'finished';
        currentEditBook.finishedDate = new Date().toISOString();
    }

    saveDataToStorage();
    closeEditModal();
    updateStats();
    updateStreak();
    renderCurrentView();
}

function handleDeleteBook() {
    if (!currentEditBook) return;
    
    if (confirm(`Are you sure you want to delete "${currentEditBook.title}"?`)) {
        // Remove the book's reading activity from the totals
        if (currentEditBook.readingDays) {
            Object.keys(currentEditBook.readingDays).forEach(date => {
                const pagesRead = currentEditBook.readingDays[date];
                if (readingActivity[date]) {
                    readingActivity[date] -= pagesRead;
                    // Remove the date entry if it's now 0
                    if (readingActivity[date] <= 0) {
                        delete readingActivity[date];
                    }
                }
            });
        }
        
        myBooks = myBooks.filter(b => b.id !== currentEditBook.id);
        saveDataToStorage();
        closeEditModal();
        updateStats();
        updateStreak();
        renderCurrentView();
        if (currentView === 'stats') {
            renderStats(); // Re-render stats to update the chart
        }
    }
}

// Progress Update
function handleProgressUpdate() {
    if (!currentBookForProgress) return;

    const newPage = parseInt(document.getElementById('updatePage').value);
    const oldPage = currentBookForProgress.currentPage;
    const pagesRead = newPage - oldPage;

    if (pagesRead > 0) {
        const today = new Date().toISOString().split('T')[0];
        readingActivity[today] = (readingActivity[today] || 0) + pagesRead;
        
        // Track which book was read
        if (!currentBookForProgress.readingDays) currentBookForProgress.readingDays = {};
        currentBookForProgress.readingDays[today] = (currentBookForProgress.readingDays[today] || 0) + pagesRead;
    }

    currentBookForProgress.currentPage = newPage;
    
    if (newPage >= currentBookForProgress.totalPages) {
        currentBookForProgress.status = 'finished';
        currentBookForProgress.finishedDate = new Date().toISOString();
    }

    saveDataToStorage();
    closeProgressModal();
    updateStats();
    updateStreak();
    renderCurrentView();
}

// Helper Functions
function getBookEmoji(genre) {
    const emojis = {
        'Productivity': '⚙️',
        'Psychology': '🧠',
        'Non-Fiction': '🌿',
        'Finance': '💰',
        'Business': '🏢',
        'Philosophy': '🏛️',
        'Fiction': '📖',
        'Self-Help': '💪',
        'History': '📜',
        "Children's": '👶'
    };
    return emojis[genre] || '📖';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'today';
    if (date.toDateString() === yesterday.toDateString()) return 'yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
