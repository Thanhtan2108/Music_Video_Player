/**
 * main.js
 * -------
 * Entry point — khởi động và kết nối tất cả module.
 *
 * Kiến trúc player:
 *   - 1 iframe YouTube cố định (#main-youtube-player) trong player-bar
 *   - Các video card chỉ hiển thị thumbnail + thông tin
 *   - Click card → load video vào player cố định
 */

import { PLAYLISTS }                   from './data/videos.js';
import { loadYouTubeApi }              from './modules/youtube-player.js';
import { init as initPlaylistManager,
         playVideo,
         onVideoChanged }              from './modules/playlist-manager.js';
import { init as initSearch }          from './modules/search.js';
import { init as initControls,
         enableControls }              from './modules/ui-controls.js';


// ─────────────────────────────────────────────
// 1. KHỞI ĐỘNG
// ─────────────────────────────────────────────

function initApp() {
  loadYouTubeApi();
  renderAllPlaylists();
  initPlaylistManager();
  initSearch({
    onRenderCard: createVideoCardElement,
    onPlayVideo:  handleVideoPlay,
  });
  initControls();
  onVideoChanged(handleVideoChanged);
  setFooterYear();
}


// ─────────────────────────────────────────────
// 2. RENDER PLAYLIST & CARD
// ─────────────────────────────────────────────

function renderAllPlaylists() {
  const listEl = document.getElementById('playlist-list');
  if (!listEl) return;

  const fragment = document.createDocumentFragment();
  PLAYLISTS.forEach((playlist) => {
    fragment.appendChild(createPlaylistSectionElement(playlist));
  });
  listEl.appendChild(fragment);
}

function createPlaylistSectionElement(playlist) {
  const section = document.createElement('section');
  section.className         = 'playlist-section';
  section.id                = `playlist-${playlist.id}`;
  section.dataset.playlistId = playlist.id;

  const header = document.createElement('div');
  header.className = 'playlist-section__header';
  header.innerHTML = `
    <div class="playlist-section__color-bar" style="background-color: ${playlist.coverColor}"></div>
    <div class="playlist-section__info">
      <h2 class="playlist-section__name">${escapeHtml(playlist.name)}</h2>
      <p class="playlist-section__description">${escapeHtml(playlist.description)}</p>
      <span class="playlist-section__count">${playlist.videos.length} bài</span>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className          = 'video-grid';
  grid.dataset.playlistId = playlist.id;

  playlist.videos.forEach((video, index) => {
    const card = createVideoCardElement(video, playlist.id);
    card.style.setProperty('--card-index', index);
    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

/**
 * Tạo video card — chỉ có thumbnail tĩnh, KHÔNG có iframe.
 * Player nằm ở player-bar cố định.
 */
function createVideoCardElement(video, playlistId) {
  const card = document.createElement('article');
  card.className          = 'video-card';
  card.dataset.videoId    = video.id;
  card.dataset.playlistId = playlistId;

  // Thumbnail từ YouTube (không cần load YouTube API)
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;

  card.innerHTML = `
    <div class="video-card__iframe-wrapper">
      <img
        class="video-card__thumbnail"
        src="${thumbnailUrl}"
        alt="${escapeHtml(video.title)}"
        loading="lazy"
        onerror="this.style.display='none'"
      />
      <div class="video-card__overlay">
        <button class="video-card__play-btn" type="button" aria-label="Phát ${escapeHtml(video.title)}">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="video-card__info">
      <h3 class="video-card__title">${escapeHtml(video.title)}</h3>
      <p class="video-card__artist">${escapeHtml(video.artist)}</p>
      <span class="video-card__playing-badge">Đang phát</span>
    </div>
  `;

  card.addEventListener('click', () => handleVideoPlay(video.id));
  return card;
}


// ─────────────────────────────────────────────
// 3. XỬ LÝ SỰ KIỆN
// ─────────────────────────────────────────────

function handleVideoPlay(videoId) {
  // Hiện player bar lần đầu
  const playerBar = document.getElementById('player-bar');
  if (playerBar && playerBar.hasAttribute('hidden')) {
    playerBar.removeAttribute('hidden');
  }

  playVideo(videoId);
  enableControls();
}

function handleVideoChanged(videoId) {
  updatePageTitle(videoId);
}


// ─────────────────────────────────────────────
// 4. TIỆN ÍCH
// ─────────────────────────────────────────────

function updatePageTitle(videoId) {
  import('./data/videos.js').then(({ getVideoById }) => {
    const entry = getVideoById(videoId);
    if (!entry) return;
    document.title = `${entry.video.title} — ${entry.video.artist} | MusicPlay`;
  });
}

function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

function escapeHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}


// ─────────────────────────────────────────────
// 5. KHỞI CHẠY
// ─────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
