        // DOM Elements
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');
        const searchSuggestions = document.querySelector('.search-suggestions');
        const resultsGrid = document.querySelector('.results-grid');
        const loading = document.querySelector('.loading');
        const emptyState = document.querySelector('.empty-state');
        const errorState = document.querySelector('.error-state');
        const modal = document.querySelector('.modal');
        const modalTitle = document.querySelector('.modal-title');
        const modalImage = document.querySelector('.modal-image');
        const modalText = document.querySelector('.modal-text');
        const modalDate = document.querySelector('.modal-date span');
        const closeBtn = document.querySelector('.close-btn');

        // Event Listeners
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            } else {
                showSuggestions();
            }
        });
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Initial load with popular articles
        document.addEventListener('DOMContentLoaded', function() {
            loadPopularArticles();
        });

        // Functions
        async function performSearch() {
            const query = searchInput.value.trim();
            if (!query) return;
            
            showLoading();
            hideEmptyState();
            hideErrorState();
            
            try {
                const results = await searchWikipedia(query);
                displayResults(results);
            } catch (error) {
                console.error('Error searching Wikipedia:', error);
                showErrorState('Terjadi kesalahan saat mencari. Silakan coba lagi.');
            } finally {
                hideLoading();
            }
        }

        async function showSuggestions() {
            const query = searchInput.value.trim();
            if (!query) {
                searchSuggestions.style.display = 'none';
                return;
            }
            
            try {
                const results = await searchWikipedia(query, 5);
                displaySuggestions(results);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }

        async function loadPopularArticles() {
            // Default popular articles
            const popularTopics = ['Indonesia', 'Teknologi', 'Sejarah', 'Ilmu Pengetahuan', 'Budaya'];
            const randomTopic = popularTopics[Math.floor(Math.random() * popularTopics.length)];
            
            try {
                const results = await searchWikipedia(randomTopic, 6);
                displayResults(results);
                hideEmptyState();
            } catch (error) {
                console.error('Error loading popular articles:', error);
            }
        }

        async function searchWikipedia(query, limit = 10) {
            try {
                // Search API to get page titles
                const searchResponse = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`
                );
                
                if (!searchResponse.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const searchData = await searchResponse.json();
                
                if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                    return [];
                }
                
                // Get summaries for each search result
                const results = [];
                
                for (const item of searchData.query.search) {
                    try {
                        const summaryResponse = await fetch(
                            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`
                        );
                        
                        if (summaryResponse.ok) {
                            const summaryData = await summaryResponse.json();
                            
                            results.push({
                                id: item.pageid,
                                title: summaryData.title,
                                snippet: summaryData.extract || 'Tidak ada ringkasan tersedia',
                                image: summaryData.thumbnail ? summaryData.thumbnail.source : getDefaultImage(),
                                date: summaryData.timestamp ? formatDate(summaryData.timestamp) : 'Tidak diketahui',
                                fullContent: summaryData.extract_html || `<p>${summaryData.extract || 'Konten tidak tersedia'}</p>`
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching summary for ${item.title}:`, error);
                        // Continue with next item even if one fails
                    }
                }
                
                return results;
            } catch (error) {
                console.error('Error searching Wikipedia:', error);
                throw error;
            }
        }

        function getDefaultImage() {
            // Return a default placeholder image
            return 'https://via.placeholder.com/400x300?text=No+Image';
        }

        function formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        function displayResults(results) {
            resultsGrid.innerHTML = '';
            
            if (results.length === 0) {
                showEmptyState('Tidak ada hasil ditemukan untuk pencarian Anda.');
                return;
            }
            
            results.forEach(result => {
                const card = document.createElement('div');
                card.className = 'result-card';
                card.innerHTML = `
                    <img src="${result.image}" alt="${result.title}" class="card-image">
                    <div class="card-content">
                        <h3 class="card-title">${result.title}</h3>
                        <p class="card-snippet">${result.snippet}</p>
                        <div class="card-date">
                            <i class="far fa-calendar-alt"></i>
                            <span>Diperbarui: ${result.date}</span>
                        </div>
                    </div>
                `;
                
                card.addEventListener('click', () => openModal(result));
                resultsGrid.appendChild(card);
            });
        }

        function displaySuggestions(results) {
            searchSuggestions.innerHTML = '';
            
            results.forEach(result => {
                const suggestion = document.createElement('div');
                suggestion.className = 'suggestion-item';
                suggestion.textContent = result.title;
                
                suggestion.addEventListener('click', () => {
                    searchInput.value = result.title;
                    searchSuggestions.style.display = 'none';
                    performSearch();
                });
                
                searchSuggestions.appendChild(suggestion);
            });
            
            searchSuggestions.style.display = 'block';
        }

        function openModal(article) {
            modalTitle.textContent = article.title;
            modalImage.src = article.image;
            modalImage.alt = article.title;
            modalText.innerHTML = article.fullContent;
            modalDate.textContent = article.date;
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function showLoading() {
            loading.style.display = 'block';
            resultsGrid.innerHTML = '';
        }

        function hideLoading() {
            loading.style.display = 'none';
        }

        function showEmptyState(message) {
            emptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>${message}</h3>
                <p>Coba gunakan kata kunci yang berbeda atau lebih spesifik</p>
            `;
            emptyState.style.display = 'block';
        }

        function hideEmptyState() {
            emptyState.style.display = 'none';
        }

        function showErrorState(message) {
            errorState.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
            `;
            errorState.style.display = 'block';
        }

        function hideErrorState() {
            errorState.style.display = 'none';
        }
