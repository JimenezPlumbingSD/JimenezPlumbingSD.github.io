document.addEventListener('DOMContentLoaded', function() {
    const teams = {
        'LAL': 'Los Angeles Lakers',
        'LAC': 'Los Angeles Chargers',
        'SD': 'San Diego Padres',
        'LAD': 'Los Angeles Dodgers',
        'COLLEGE': 'College Sports'
    };

    const tabsContainer = document.querySelector('#jps-sports-news-widget .tabs');
    const newsTicker = document.querySelector('#jps-sports-news-widget .news-ticker');
    const newsContent = document.querySelector('#jps-sports-news-widget .news-content');

    function createTabs() {
        for (const teamAbbrev in teams) {
            const button = document.createElement('button');
            button.textContent = teams[teamAbbrev];
            button.dataset.team = teamAbbrev;
            tabsContainer.appendChild(button);

            button.addEventListener('click', () => {
                setActiveTab(button);
                fetchNews(teamAbbrev);
            });
        }
    }

    function setActiveTab(activeButton) {
        const buttons = tabsContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    async function fetchNews(teamAbbrev) {
        let urls = [];
        if (teamAbbrev === 'COLLEGE') {
            urls.push('https://now.core.api.espn.com/v1/sports/news?sport=college-football&limit=5');
            urls.push('https://now.core.api.espn.com/v1/sports/news?sport=mens-college-basketball&limit=5');
        } else {
            urls.push(`https://now.core.api.espn.com/v1/sports/news?team=${teamAbbrev}&limit=10`);
        }

        const responses = await Promise.all(urls.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));

        const allHeadlines = data.flatMap(d => d.headlines);

        // Sort headlines by published date
        allHeadlines.sort((a, b) => new Date(b.published) - new Date(a.published));

        newsTicker.innerHTML = '';
        newsContent.innerHTML = '';

        allHeadlines.forEach(headline => {
            const link = document.createElement('a');
            link.href = headline.links.web.href;
            link.textContent = headline.headline;
            link.target = '_blank'; // Open in new tab

            const tickerItem = document.createElement('div');
            tickerItem.classList.add('news-ticker-item');
            tickerItem.appendChild(link);
            newsTicker.appendChild(tickerItem);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                displayArticle(headline);
            });
        });
    }

    function displayArticle(headline) {
        newsContent.innerHTML = `
            <h2>${headline.headline}</h2>
            <p>${headline.description}</p>
            ${headline.video.length > 0 ? `<video controls src="${headline.video[0].links.source.href}" width="100%"></video>` : ''}
            <a href="${headline.links.web.href}" target="_blank">Read Full Story</a>
        `;
    }

    createTabs();
    // Fetch news for the first team by default
    const firstTeam = Object.keys(teams)[0];
    const firstButton = tabsContainer.querySelector(`[data-team="${firstTeam}"]`);
    setActiveTab(firstButton);
    fetchNews(firstTeam);
});
