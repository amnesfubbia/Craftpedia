const API_KEY = 'bfa7df5310c9974f62f26c6789a8c00d';
let page = 1, loading = false, currentType = 'multi', currentGenre = '', currentYear = '', currentCountry = '', currentSchedule = 'trending', searchQuery = '', currentCompany = '', currentLibMode = false, currentCastId = '';
let isExpanded = false, globalFullDesc = "", globalEnDesc = "", currentIdx = 0, startX = 0, isTranslated = false, originalIndoDesc = "";
let abortController = null;

window.onload = () => {
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('mainProfile').style.display = 'block';
    }, 2500);

    initFilters(); initHighlights(); loadFeed(); setupSwipe(); initSmartSearch(); 
    window.addEventListener('scroll', () => { 
        document.getElementById('backToTop').style.display = window.scrollY > 500 ? 'flex' : 'none'; 
    }); 
};

function updateActiveNav(el) { document.querySelectorAll('.bottom-nav i').forEach(i => i.classList.remove('active-nav')); el.classList.add('active-nav'); }

function toggleSideMenu() {
    const menu = document.getElementById('sideMenu');
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
    document.body.style.overflow = isVisible ? 'auto' : 'hidden';
}

function backToHome() {
    closeModal(); closeSearch(); closeD();
    currentGenre = ''; currentYear = ''; currentCountry = ''; currentSchedule = 'trending'; 
    currentType = 'multi'; searchQuery = ''; currentCastId = ''; currentCompany = '';
    
    document.querySelectorAll('.highlight-item').forEach(i => i.classList.remove('active-hl'));
    
    document.getElementById('btnGenre').innerText = 'Genre';
    document.getElementById('yearBtn').innerText = 'Tahun';
    document.getElementById('btnCountry').innerText = 'Negara';
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active-pill'));
    document.querySelectorAll('.btn-ig').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stat-item').forEach(s => s.classList.remove('active-stat'));
    document.getElementById('filterBar').style.display = 'none';
    document.getElementById('tabGrid').classList.add('active');
    document.getElementById('tabLikes').classList.remove('active');
    document.getElementById('tabBookmark').classList.remove('active');
    updateActiveNav(document.getElementById('homeBtnNav'));
    currentLibMode = false;
    loadFeed(true);
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function initSmartSearch() { 
    const inp = document.getElementById('searchInp'); 
    const drop = document.getElementById('smartSearchDropdown'); 
    let timeout = null; 
    inp.addEventListener('input', () => { 
        clearTimeout(timeout); 
        const q = inp.value.trim(); 
        if(q.length < 2) { drop.style.display = 'none'; return; } 
        timeout = setTimeout(async () => { 
            try { 
                const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${API_KEY}&language=id-ID`); 
                const data = await res.json(); 
                const results = (data.results || []).slice(0, 5); 
                if(results.length) { 
                    drop.innerHTML = results.map(m => {
                        const mType = m.media_type || 'movie';
                        const mId = m.id;
                        const isPerson = mType === 'person';
                        const clickAction = isPerson ? `searchByCast(${mId})` : `openModal(${mId}, '${mType}')`;
                        const meta = isPerson ? 'Pemeran / Aktor' : (mType === 'tv' ? 'Series' : 'Film');
                        const imgPath = m.poster_path || m.profile_path || '';
                        
                        return `<div class="smart-item" onclick="${clickAction}; document.getElementById('smartSearchDropdown').style.display='none';">
                            <img src="https://image.tmdb.org/t/p/w92${imgPath}">
                            <div class="smart-info">
                                <span class="smart-name">${m.title || m.name}</span>
                                <span class="smart-meta">${meta}</span>
                            </div>
                        </div>`;
                    }).join(''); 
                    drop.style.display = 'block'; 
                } else { drop.style.display = 'none'; } 
            } catch(e){} 
        }, 300); 
    }); 
    document.addEventListener('click', (e) => { if(!e.target.closest('.search-input-box')) drop.style.display = 'none'; }); 
}

async function openComingSoon() {
    const grid = document.getElementById('searchGrid');
    const overlay = document.getElementById('searchOverlay');
    const titleInp = document.getElementById('searchInp');
    
    overlay.style.display = 'block';
    titleInp.value = '';
    titleInp.placeholder = "Jadwal Rilis Mendatang...";
    grid.innerHTML = '<div class="col-span-3 text-center py-10 text-zinc-500">Memuat jadwal rilis...</div>';
    document.body.style.overflow = 'hidden';

    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=id-ID&sort_by=primary_release_date.asc&primary_release_date.gte=${today}`);
        const data = await res.json();
        
        grid.innerHTML = ''; 
        
        data.results.forEach(m => {
            if(!m.release_date) return;
            const relDate = new Date(m.release_date);
            const day = relDate.getDate();
            const month = relDate.toLocaleDateString('id-ID', { month: 'short' });

            const item = document.createElement('div');
            item.className = 'col-span-3 calendar-item cursor-pointer active:bg-zinc-900';
            item.onclick = () => openModal(m.id, 'movie');
            item.innerHTML = `
                <div class="calendar-date">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="flex-grow">
                    <div class="text-[14px] font-bold text-white truncate w-48">${m.title}</div>
                    <div class="text-[11px] text-zinc-500">Rating: ★ ${m.vote_average.toFixed(1)}</div>
                </div>
                <img src="https://image.tmdb.org/t/p/w92${m.poster_path}" class="w-12 h-16 object-cover rounded">
            `;
            grid.appendChild(item);
        });
    } catch (e) {
        grid.innerHTML = '<div class="col-span-3 text-center py-10">Gagal memuat jadwal.</div>';
    }
}

function searchByCast(castId) { 
    closeModal(); 
    currentCastId = castId; 
    searchQuery = ''; 
    document.getElementById('searchInp').value = ''; 
    document.getElementById('searchOverlay').style.display = 'block'; 
    document.getElementById('smartSearchDropdown').style.display = 'none';
    document.body.style.overflow='hidden'; 
    loadFeed(true); 
}

function initHighlights() { 
    const hls = [
        {n: 'Disney', com: '2|6125|3166|34213', img: 'Disney.png', t: 'movie', s: true},
        {n: 'Pixar', com: '3', img: 'Pixar.png', t: 'movie', s: true},
        {n: 'Dreamworks', com: '521|7|1778', img: 'Dreamwork.png', t: 'movie', s: true},
        {n: 'Ghibli', com: '10342', img: 'Ghibli.png', t: 'movie', s: true},
        {n: 'Anime', g: 16, img: 'Anime.png', t: 'movie', c: 'JP', s: true},
        {n: 'Indonesia', c: 'ID', img: 'Indonesia.png', t: 'movie', s: false},
        {n: 'Korea', c: 'KR', img: 'Korea.png', t: 'movie', s: false},
        {n: 'India', c: 'IN', img: 'Indonesia.png', t: 'movie', s: false},
        {n: 'Thailand', c: 'TH', img: 'Thailand.png', t: 'movie', s: false}
    ]; 
    const cont = document.getElementById('highlightList'); 
    hls.forEach(h => { 
        const div = document.createElement('div'); 
        div.className = 'highlight-item'; 
        div.onclick = () => { 
            document.querySelectorAll('.highlight-item').forEach(i => i.classList.remove('active-hl'));
            div.classList.add('active-hl');
            currentLibMode = false; currentCastId = ''; searchQuery = ''; currentCountry = h.c || ''; currentGenre = h.g || ''; currentCompany = h.com || ''; currentSchedule = 'trending'; currentType = h.t; currentYear = ''; loadFeed(true); 
        }; 
        const circleClass = h.s ? 'highlight-circle logo-small' : 'highlight-circle';
        div.innerHTML = `<div class="${circleClass}"><img src="${h.img}" onerror="this.src='https://via.placeholder.com/100?text=${h.n}'"></div><div class="highlight-text">${h.n}</div>`; 
        cont.appendChild(div); 
    }); 
}

function initFilters() { 
    const yD = document.getElementById('yearDropdown'); 
    let yearHTML = '<div class="filter-item sticky-reset" onclick="setYear(\'\')">Semua Tahun</div>'; 
    for(let y=2026; y>=1900; y--) yearHTML += `<div class="filter-item" onclick="setYear(${y})">${y}</div>`; 
    yD.innerHTML = yearHTML; 
    const countries = [['ID','Indonesia'],['US','USA'],['KR','Korea Selatan'],['JP','Jepang'],['IN','India'],['TH','Thailand'],['CN','China'],['PH','Filipina'],['GB','Inggris'],['FR','Prancis'],['ES','Spanyol'],['IT','Italia'],['TR','Turki'],['DE','Jerman']]; 
    const cD = document.getElementById('countryDropdown'); 
    let countryHTML = '<div class="filter-item sticky-reset" onclick="setCountry(\'\',\'Negara\')">Semua Negara</div>'; 
    countries.forEach(c => countryHTML += `<div class="filter-item" onclick="setCountry('${c[0]}','${c[1]}')">${c[1]}</div>`); 
    cD.innerHTML = countryHTML; 
    const genres = [[28,'Action'],[12,'Adventure'],[16,'Animasi'],[35,'Komedi'],[80,'Crime'],[99,'Dokumenter'],[18,'Drama'],[10751,'Family'],[14,'Fantasy'],[36,'History'],[27,'Horror'],[10402,'Music'],[9648,'Misteri'],[10749,'Romance'],[878,'Sci-Fi'],[53,'Thriller']]; 
    const gD = document.getElementById('genreDropdown'); 
    let genreHTML = '<div class="filter-item sticky-reset" onclick="setGenre(\'\',\'Genre\')">Semua Genre</div>'; 
    genres.forEach(g => genreHTML += `<div class="filter-item" onclick="setGenre('${g[0]}','${g[1]}')">${g[1]}</div>`); 
    gD.innerHTML = genreHTML; 
}

function toggleFilter(e, id) { e.stopPropagation(); const d = document.getElementById(id); const overlay = document.getElementById('filterOverlay'); document.querySelectorAll('.filter-dropdown').forEach(el => el.style.display = 'none'); d.style.display = 'block'; d.scrollTop = 0; overlay.style.display = 'block'; document.body.style.overflow = 'hidden'; }
function closeD() { document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none'); document.getElementById('filterOverlay').style.display = 'none'; document.body.style.overflow = 'auto'; }

async function loadFeed(isNew = true) {
    if(loading && isNew) { if(abortController) abortController.abort(); }
    if(loading && !isNew) return;
    loading = true; abortController = new AbortController();
    const grid = document.getElementById('searchOverlay').style.display === 'block' ? document.getElementById('searchGrid') : document.getElementById('feedGrid');
    if(isNew) { page = 1; grid.innerHTML = ''; }
    
    let url;
    if(currentCastId) { url = `https://api.themoviedb.org/3/person/${currentCastId}/combined_credits?api_key=${API_KEY}&language=id-ID`; }
    else if(searchQuery) { url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(searchQuery)}&api_key=${API_KEY}&language=id-ID&page=${page}&include_adult=false`; }
    else if(currentType === 'multi') { url = `https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}&language=id-ID&page=${page}`; }
    else {
        let endpoint = (currentType === 'tv') ? 'discover/tv' : 'discover/movie';
        url = `https://api.themoviedb.org/3/${endpoint}?api_key=${API_KEY}&language=id-ID&page=${page}&include_adult=false&sort_by=popularity.desc`;
        if(currentCountry) url += `&with_origin_country=${currentCountry}`;
        if(currentGenre) url += `&with_genres=${currentGenre}`;
        if(currentCompany) url += `&with_companies=${currentCompany}`;
        if(currentType === 'short') url += `&with_runtime.lte=40&with_runtime.gte=1`;
        if(currentSchedule === 'now_playing' || currentSchedule === 'upcoming') { 
            const today = new Date().toISOString().split('T')[0]; 
            if(currentSchedule === 'now_playing') { 
                const prev = new Date(Date.now() - 60*24*60*60*1000).toISOString().split('T')[0]; 
                url += `&primary_release_date.gte=${prev}&primary_release_date.lte=${today}`; 
            } else { url += `&primary_release_date.gte=${today}`; } 
        }
        if(currentYear) {
            if(endpoint === 'discover/tv') url += `&first_air_date_year=${currentYear}`;
            else url += `&primary_release_year=${currentYear}`;
        }
    }

    try { 
        const res = await fetch(url, { signal: abortController.signal }); 
        const data = await res.json(); 
        let items = data.results || data.cast || []; 
        if(currentCastId) items.sort((a,b) => b.popularity - a.popularity);
        if(items.length === 0 && isNew) {
            grid.innerHTML = `<div class="col-span-3 text-center py-20 text-zinc-600 text-xs">Konten tidak ditemukan.</div>`;
        } else {
            renderGrid(items, grid); 
        }
    } catch(e) { if(e.name !== 'AbortError') console.error(e); }
    loading = false;
}

function renderGrid(items, grid) { 
    items.forEach(m => { 
        if(!m.poster_path || m.media_type === 'person') return; 
        let mType = m.media_type;
        if(!mType) {
            if(currentType === 'tv') mType = 'tv';
            else if(currentType === 'movie' || currentType === 'short') mType = 'movie';
            else mType = 'movie'; 
        }
        const card = document.createElement('div'); 
        card.className = 'post-card'; 
        card.onclick = function() { openModal(m.id, mType); }; 
        card.innerHTML = `<div class="badge-rating">★ ${(m.vote_average||0).toFixed(1)}</div><div class="badge-type">${currentType==='short'?'SHORT':(mType==='tv'?'SERIES':'FILM')}</div><img src="https://image.tmdb.org/t/p/w342${m.poster_path}" loading="lazy">`; 
        grid.appendChild(card); 
    }); 
}

function openSearch() { 
    const titleInp = document.getElementById('searchInp');
    document.getElementById('searchOverlay').style.display = 'block'; 
    titleInp.placeholder = "Cari film, series, atau aktor...";
    titleInp.value = ''; 
    document.getElementById('searchGrid').innerHTML = ''; 
    titleInp.focus(); 
    document.body.style.overflow='hidden'; 
}
function closeSearch() { document.getElementById('searchOverlay').style.display = 'none'; document.body.style.overflow='auto'; searchQuery=''; currentCastId=''; document.getElementById('smartSearchDropdown').style.display = 'none'; }

function searchAction() { 
    currentLibMode = false; 
    currentCastId = ''; 
    searchQuery = document.getElementById('searchInp').value; 
    document.getElementById('smartSearchDropdown').style.display = 'none'; 
    loadFeed(true); 
}

function toggleFilterBar() { const b = document.getElementById('filterBar'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function setSchedule(v, el) { 
    currentLibMode = false; currentCastId = ''; searchQuery = ''; 
    const isActive = el.classList.contains('active');
    document.querySelectorAll('.btn-ig').forEach(b=>b.classList.remove('active')); 
    if(isActive) { currentSchedule = 'trending'; } 
    else { el.classList.add('active'); currentSchedule = v; }
    if(currentType === 'multi') currentType = 'movie';
    loadFeed(true); 
}

function setFilter(k, v, el) { 
    currentLibMode = false; currentCastId = ''; searchQuery = ''; 
    currentType = v; 
    document.querySelectorAll('.stat-item').forEach(s => s.classList.remove('active-stat'));
    el.classList.add('active-stat');
    loadFeed(true); 
}

function setYear(y) { 
    currentYear = y; 
    const btn = document.getElementById('yearBtn');
    btn.innerText = y || 'Tahun'; 
    y ? btn.classList.add('active-pill') : btn.classList.remove('active-pill');
    if(currentType === 'multi') currentType = 'movie';
    closeD(); loadFeed(true); 
}

function setCountry(c, n) { 
    currentCountry = c; 
    const btn = document.getElementById('btnCountry');
    btn.innerText = n; 
    c ? btn.classList.add('active-pill') : btn.classList.remove('active-pill');
    if(currentType === 'multi') currentType = 'movie';
    closeD(); loadFeed(true); 
}

function setGenre(g, n) { 
    currentGenre = g; 
    const btn = document.getElementById('btnGenre');
    btn.innerText = n; 
    g ? btn.classList.add('active-pill') : btn.classList.remove('active-pill');
    if(currentType === 'multi') currentType = 'movie';
    closeD(); loadFeed(true); 
}

function getEmbedUrl(provider, type, id, s=1, e=1) {
    if(provider === 'vidlink') {
        return type === 'movie' ? `https://vidlink.pro/movie/${id}` : `https://vidlink.pro/tv/${id}/${s}/${e}`;
    }
    if(provider === 'vidnest') {
        return type === 'movie' ? `https://vidnest.fun/movie/${id}` : `https://vidnest.fun/tv/${id}/${s}/${e}`;
    }
    if(provider === '2embed') {
        return type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
    }
    return "";
}

function requestRotate() {
    const iframe = document.querySelector('#carouselTrack iframe');
    if(!iframe) return;
    
    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(e => console.log("Auto-rotate diblokir browser"));
    }
}

async function openModal(id, type) {
    window.currentMediaId = id; window.currentMediaType = type;
    window.currentS = 1; window.currentE = 1; 
    
    document.getElementById('movieModal').style.display = 'block'; 
    document.getElementById('movieModal').scrollTop = 0;
    document.getElementById('smartSearchDropdown').style.display = 'none'; document.body.style.overflow = 'hidden'; currentIdx = 0; isTranslated = false;
    
    const [rId, rEn, rCast] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=id-ID&append_to_response=videos,production_companies`),
        fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos`),
        fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`)
    ]);
    
    const dId = await rId.json(), dEn = await rEn.json(), dCast = await rCast.json();
    const vids = [...(dId.videos?.results || []), ...(dEn.videos?.results || [])].filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')).slice(0, 4);
    const track = document.getElementById('carouselTrack'), dots = document.getElementById('carouselDots');
    
    track.querySelectorAll('iframe').forEach(f => f.src = "");
    track.innerHTML = ''; dots.innerHTML = ''; track.style.transform = 'translateX(0)';
    
    if(vids.length > 0) { 
        vids.forEach((v, i) => { 
            track.innerHTML += `<div class="carousel-slide"><iframe id="yt-${i}" src="https://www.youtube.com/embed/${v.key}?enablejsapi=1&autoplay=${i===0?1:0}&rel=0" class="w-full h-full" allow="autoplay; fullscreen"></iframe></div>`; 
            if(vids.length > 1) {
                dots.innerHTML += `<div class="dot w-1.5 h-1.5 rounded-full ${i===currentIdx?'bg-blue-500':'bg-zinc-700'}"></div>`; 
            }
        }); 
        document.getElementById('swipeOverlay').style.display = vids.length > 1 ? 'block' : 'none'; 
    } else { 
        track.innerHTML = `<div class="carousel-slide"><iframe src="https://vidsrc.me/embed/${type}?tmdb=${id}" class="w-full h-full" allowfullscreen></iframe></div>`; 
        document.getElementById('swipeOverlay').style.display = 'none'; 
    }

    document.getElementById('castContainer').innerHTML = (dCast.cast || []).slice(0, 10).map(c => {
        const profileImg = c.profile_path 
            ? `<img src="https://image.tmdb.org/t/p/w185${c.profile_path}" loading="lazy">` 
            : `<div style="width:100%; height:100%; background:#000;"></div>`;
        
        return `
            <div class="cast-item" onclick="searchByCast(${c.id})">
                <div class="cast-img-border">
                    <div class="inner-border">
                        ${profileImg}
                    </div>
                </div>
                <span class="cast-name">${c.name}</span>
            </div>`;
    }).join('');

    document.getElementById('mLikeDisplay').innerText = `${Math.floor((dId.vote_average || 0) * 1234).toLocaleString('id-ID')} suka`; document.getElementById('mTitle').innerText = dId.title || dId.name || dEn.title;
    
    originalIndoDesc = dId.overview;
    globalFullDesc = originalIndoDesc || dEn.overview || "Sinopsis belum tersedia untuk konten ini.";
    globalEnDesc = dEn.overview;
    
    if(globalEnDesc && globalEnDesc !== originalIndoDesc) { 
        document.getElementById('mTranslateBtn').classList.remove('hidden'); 
        document.getElementById('mTranslateBtn').innerText = "Lihat terjemahan"; 
    } else { document.getElementById('mTranslateBtn').classList.add('hidden'); }
    
    isExpanded = false; 
    renderSynopsis();

    const relYear = (dId.release_date || dId.first_air_date || "2026").split('-')[0];
    const contentKind = (type === 'tv') ? 'Series' : 'Film';
    const genresArr = (dId.genres || []).map(g => `#${g.name.replace(/[^a-zA-Z0-9]/g, '')}`).slice(0, 3).join(' ');
    const studiosArr = (dId.production_companies || []).map(c => `#${c.name.replace(/[^a-zA-Z0-9]/g, '')}`).slice(0, 2).join(' ');
    document.getElementById('mHashtags').innerHTML = `#${(dId.title||dId.name||"").replace(/[^a-zA-Z0-9]/g, '')} #${relYear} #${contentKind} <br> ${genresArr} ${studiosArr}`;
    const rel = dId.release_date || dId.first_air_date || ""; 
    document.getElementById('mDateDisplay').innerText = rel ? new Date(rel).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    
    document.getElementById('serverList').innerHTML = `
        <button class="server-btn" onclick="playVid('https://vidsrc.me/embed/${type}?tmdb=${id}', this)">Server 1</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('vidlink', '${type}', '${id}'), this)">Server 2</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('vidnest', '${type}', '${id}'), this)">Server 3</button>
        <button class="server-btn" onclick="playVid('https://vidrock.net/embed/${type}/${id}${type==='tv'?'/1/1':''}', this)">Server 4</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('2embed', '${type}', '${id}'), this)">Server 5</button>
        <button class="server-btn" onclick="playVid('https://embed.smashystream.com/playere.php?tmdb=${id}', this)">Server 6</button>
    `;

    if(type === 'tv') { document.getElementById('seriesControl').classList.remove('hidden'); document.getElementById('seasonSel').innerHTML = (dId.seasons||[]).filter(s=>s.season_number>0).map(s=>`<option value="${s.season_number}">Season ${s.season_number}</option>`).join(''); loadEpisodes(); } else { document.getElementById('seriesControl').classList.add('hidden'); }
    updateLibButtons(id);
}

async function handleTranslate() {
    const btn = document.getElementById('mTranslateBtn');
    if(!isTranslated) {
        const oldText = btn.innerText;
        btn.innerText = "Menerjemahkan...";
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(globalEnDesc)}`);
            const data = await res.json();
            globalFullDesc = data[0].map(x => x[0]).join('');
            isTranslated = true;
            btn.innerText = "Lihat versi asli";
            renderSynopsis();
        } catch(e) { btn.innerText = "Gagal menerjemahkan"; setTimeout(()=>btn.innerText=oldText, 2000); }
    } else {
        globalFullDesc = originalIndoDesc || globalEnDesc || "Sinopsis tidak tersedia.";
        isTranslated = false;
        btn.innerText = "Lihat terjemahan";
        renderSynopsis();
    }
}

function closeModal() { 
    const track = document.getElementById('carouselTrack'); 
    track.querySelectorAll('iframe').forEach(f => f.src = "");
    track.innerHTML = ''; 
    document.getElementById('movieModal').style.display = 'none'; 
    document.body.style.overflow = 'auto';
}

function renderSynopsis() { const descEl = document.getElementById('mDesc'), toggleBtn = document.getElementById('mToggleBtn'); if (globalFullDesc.length > 90) { toggleBtn.classList.remove('hidden'); descEl.innerText = isExpanded ? globalFullDesc : globalFullDesc.substring(0, 90) + "..."; toggleBtn.innerText = isExpanded ? "ringkas" : "selengkapnya"; } else { descEl.innerText = globalFullDesc; toggleBtn.classList.add('hidden'); } }
function handleToggleDesc() { isExpanded = !isExpanded; renderSynopsis(); }

function playVid(url, el) { 
    const track = document.getElementById('carouselTrack'); 
    const dots = document.getElementById('carouselDots'); 
    track.querySelectorAll('iframe').forEach(f => f.src = "");
    track.innerHTML = `<div class="carousel-slide"><iframe src="${url}" class="w-full h-full" allowfullscreen></iframe></div>`; 
    track.style.transform = 'translateX(0)'; 
    currentIdx = 0; 
    dots.innerHTML = ''; 
    document.getElementById('swipeOverlay').style.display = 'none'; 
    highlightBtn(el); 
}

function highlightBtn(el) { document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active-link')); el.classList.add('active-link'); }

async function loadEpisodes() { 
    const s = document.getElementById('seasonSel').value; 
    window.currentS = s;
    const res = await fetch(`https://api.themoviedb.org/3/tv/${window.currentMediaId}/season/${s}?api_key=${API_KEY}`); 
    const d = await res.json(); 
    document.getElementById('episodeGrid').innerHTML = (d.episodes||[]).map(e => `
        <div class="pill text-[10px]" onclick="playEpisode('${s}', '${e.episode_number}', this)">${e.episode_number}</div>
    `).join(''); 
}

function playEpisode(s, e, el) {
    window.currentE = e;
    const url = getEmbedUrl('vidlink', 'tv', window.currentMediaId, s, e);
    playVid(url, el);
    
    document.getElementById('serverList').innerHTML = `
        <button class="server-btn" onclick="playVid('https://vidsrc.me/embed/tv?tmdb=${window.currentMediaId}&sea=${s}&epi=${e}', this)">Server 1</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('vidlink', 'tv', '${window.currentMediaId}', ${s}, ${e}), this)">Server 2</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('vidnest', 'tv', '${window.currentMediaId}', ${s}, ${e}), this)">Server 3</button>
        <button class="server-btn" onclick="playVid('https://vidrock.net/embed/tv/${window.currentMediaId}/${s}/${e}', this)">Server 4</button>
        <button class="server-btn" onclick="playVid(getEmbedUrl('2embed', 'tv', '${window.currentMediaId}', ${s}, ${e}), this)">Server 5</button>
        <button class="server-btn" onclick="playVid('https://embed.smashystream.com/playere.php?tmdb=${window.currentMediaId}&season=${s}&episode=${e}', this)">Server 6</button>
    `;
}

function setupSwipe() { 
    const overlay = document.getElementById('swipeOverlay'); 
    overlay.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true}); 
    overlay.addEventListener('touchend', e => { 
        let diff = startX - e.changedTouches[0].clientX; 
        const slides = document.querySelectorAll('.carousel-slide'); 
        if(Math.abs(diff) > 50 && slides.length > 1) { 
            let oldIdx = currentIdx; 
            if(diff > 0 && currentIdx < slides.length - 1) currentIdx++; 
            else if(diff < 0 && currentIdx > 0) currentIdx--; 
            document.getElementById('carouselTrack').style.transform = `translateX(-${currentIdx * 100}%)`; 
            document.querySelectorAll('.dot').forEach((d, i) => { d.className = `dot w-1.5 h-1.5 rounded-full ${i===currentIdx?'bg-blue-500':'bg-zinc-700'}`; }); 
            const oldVid = document.getElementById(`yt-${oldIdx}`), newVid = document.getElementById(`yt-${currentIdx}`);
            if(oldVid) try{oldVid.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');}catch(e){}
            if(newVid) try{newVid.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');}catch(e){}
        } 
    }); 
}

function updateLibButtons(id) { const isL = JSON.parse(localStorage.getItem('likes') || '[]').some(x=>x.id==id); const isB = JSON.parse(localStorage.getItem('bookmarks') || '[]').some(x=>x.id==id); document.getElementById('btnLikeModal').className = isL ? 'fa-solid fa-heart text-red-500 interaction-icon' : 'fa-regular fa-heart interaction-icon'; document.getElementById('btnBookModal').className = isB ? 'fa-solid fa-bookmark text-white interaction-icon' : 'fa-regular fa-bookmark interaction-icon'; document.getElementById('btnLikeModal').onclick = () => toggleLib('likes'); document.getElementById('btnBookModal').onclick = () => toggleLib('bookmarks'); }
function toggleLib(k) { let items = JSON.parse(localStorage.getItem(k) || '[]'); const idx = items.findIndex(x => x.id == window.currentMediaId); idx > -1 ? items.splice(idx,1) : items.push({id: window.currentMediaId, type: window.currentMediaType}); localStorage.setItem(k, JSON.stringify(items)); updateLibButtons(window.currentMediaId); }
async function switchTab(mode, el) { document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active')); el.classList.add('active'); const grid = document.getElementById('feedGrid'); grid.innerHTML = ''; if(mode === 'likes' || mode === 'bookmarks') { currentLibMode = true; showLibrary(mode); } else { currentLibMode = false; currentCastId = ''; searchQuery = ''; currentType='multi'; currentSchedule='trending'; currentCompany=''; loadFeed(true); } }
async function showLibrary(k) { const items = JSON.parse(localStorage.getItem(k) || '[]'); const grid = document.getElementById('feedGrid'); grid.innerHTML = ''; if (!items.length) { grid.innerHTML = '<div class="col-span-3 text-center py-20 text-zinc-500 text-xs">Belum ada konten disimpan</div>'; return; } const promises = items.map(i => fetch(`https://api.themoviedb.org/3/${i.type}/${i.id}?api_key=${API_KEY}&language=id-ID`).then(r => r.json())); const results = await Promise.all(promises); renderGrid(results.filter(m => m.id), grid); }
window.onscroll = () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000 && !loading && !searchQuery && !currentLibMode) { page++; loadFeed(false); } };
