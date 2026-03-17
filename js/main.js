/**
 * main.js
 * -------
 * Entry point của ứng dụng — nơi khởi động và kết nối tất cả.
 *
 * Chịu trách nhiệm:
 *   1. Khởi tạo YouTube API
 *   2. Render toàn bộ playlist và video card vào DOM
 *   3. Khởi tạo tất cả các module (player, search, controls)
 *   4. Kết nối các module với nhau
 *   5. Các tác vụ khởi động nhỏ (năm footer, v.v.)
 *
 * Nguyên tắc:
 *   - main.js biết TẤT CẢ các module nhưng các module KHÔNG biết nhau
 *     (trừ những phụ thuộc trực tiếp đã khai báo rõ ràng)
 *   - Logic nghiệp vụ KHÔNG đặt ở đây — chỉ có orchestration
 */

import { PLAYLISTS } from "./data/videos.js";
import { loadYouTubeApi } from "./modules/youtube-player.js";
import {
  init as initPlaylistManager,
  playVideo,
  onVideoChanged,
  getIframeId,
} from "./modules/playlist-manager.js";
import { init as initSearch } from "./modules/search.js";
import { init as initControls, enableControls } from "./modules/ui-controls.js";

// ─────────────────────────────────────────────
// 1. KHỞI ĐỘNG ỨNG DỤNG
// ─────────────────────────────────────────────

/**
 * Hàm khởi động chính.
 * Được gọi khi DOM đã sẵn sàng.
 */
function initApp() {
  // Bước 1: Load YouTube IFrame API (bất đồng bộ, chạy nền)
  loadYouTubeApi();

  // Bước 2: Render toàn bộ giao diện vào DOM
  renderAllPlaylists();

  // Bước 3: Khởi tạo các module theo đúng thứ tự phụ thuộc
  initPlaylistManager();

  initSearch({
    onRenderCard: createVideoCardElement,
    onPlayVideo: handleVideoPlay,
  });

  initControls();

  // Bước 4: Kết nối module với nhau
  onVideoChanged(handleVideoChanged);

  // Bước 5: Các tác vụ khởi động nhỏ
  setFooterYear();
}

// ─────────────────────────────────────────────
// 2. RENDER PLAYLIST & VIDEO CARD
// ─────────────────────────────────────────────

/**
 * Render toàn bộ PLAYLISTS vào #playlist-list.
 * Gọi 1 lần khi khởi động.
 */
function renderAllPlaylists() {
  const playlistListEl = document.getElementById("playlist-list");
  if (!playlistListEl) return;

  const fragment = document.createDocumentFragment();

  PLAYLISTS.forEach((playlist) => {
    const sectionEl = createPlaylistSectionElement(playlist);
    fragment.appendChild(sectionEl);
  });

  playlistListEl.appendChild(fragment);
}

/**
 * Tạo element <section> cho một playlist.
 *
 * @param {import('./data/videos.js').Playlist} playlist
 * @returns {HTMLElement}
 */
function createPlaylistSectionElement(playlist) {
  const section = document.createElement("section");
  section.className = "playlist-section";
  section.id = `playlist-${playlist.id}`;
  section.dataset.playlistId = playlist.id;

  // Header của playlist
  const header = document.createElement("div");
  header.className = "playlist-section__header";
  header.innerHTML = `
    <div
      class="playlist-section__color-bar"
      style="background-color: ${playlist.coverColor}"
    ></div>
    <div class="playlist-section__info">
      <h2 class="playlist-section__name">${escapeHtml(playlist.name)}</h2>
      <p class="playlist-section__description">${escapeHtml(playlist.description)}</p>
      <span class="playlist-section__count">${playlist.videos.length} bài</span>
    </div>
  `;

  // Grid video
  const grid = document.createElement("div");
  grid.className = "video-grid";
  grid.dataset.playlistId = playlist.id;

  // Render từng video card vào grid
  playlist.videos.forEach((video, index) => {
    const card = createVideoCardElement(video, playlist.id);
    card.style.setProperty("--card-index", index);
    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);

  return section;
}

/**
 * Tạo element <article> cho một video card.
 * Hàm này được tái sử dụng bởi search.js để render kết quả tìm kiếm.
 *
 * @param {import('./data/videos.js').Video} video
 * @param {string} playlistId
 * @returns {HTMLElement}
 */
function createVideoCardElement(video, playlistId) {
  const card = document.createElement("article");
  card.className = "video-card";
  card.dataset.videoId = video.id;
  card.dataset.playlistId = playlistId;

  const iframeId = getIframeId(video.id);

  card.innerHTML = `
    <div class="video-card__iframe-wrapper">
      <iframe
        class="video-card__iframe"
        id="${iframeId}"
        src="https://www.youtube.com/embed/${video.id}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}"
        title="${escapeHtml(video.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
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

  // Click vào card (hoặc nút play) → phát video
  card.addEventListener("click", () => handleVideoPlay(video.id));

  return card;
}

// ─────────────────────────────────────────────
// 3. XỬ LÝ SỰ KIỆN
// ─────────────────────────────────────────────

/**
 * Xử lý khi người dùng chọn phát một video.
 * Được gọi từ: click card, click kết quả tìm kiếm.
 *
 * @param {string} videoId
 */
function handleVideoPlay(videoId) {
  playVideo(videoId);

  // Bật các nút điều khiển lần đầu tiên
  enableControls();
}

/**
 * Xử lý khi video đang phát thay đổi.
 * Được gọi từ playlist-manager.js qua onVideoChanged().
 *
 * @param {string} videoId
 * @param {string} playlistId
 */
function handleVideoChanged(videoId, playlistId) {
  // Cập nhật title trang theo bài đang phát
  updatePageTitle(videoId);
}

// ─────────────────────────────────────────────
// 4. CẬP NHẬT TIÊU ĐỀ TRANG
// ─────────────────────────────────────────────

/**
 * Cập nhật <title> của trang theo video đang phát.
 * Giúp người dùng biết bài gì đang phát khi nhìn vào tab.
 *
 * @param {string} videoId
 */
function updatePageTitle(videoId) {
  // Import động để tránh circular dependency
  import("./data/videos.js").then(({ getVideoById }) => {
    const entry = getVideoById(videoId);
    if (!entry) return;

    const { video } = entry;
    document.title = `${video.title} — ${video.artist} | MusicPlay`;
  });
}

// ─────────────────────────────────────────────
// 5. TIỆN ÍCH
// ─────────────────────────────────────────────

/**
 * Điền năm hiện tại vào footer.
 */
function setFooterYear() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Escape HTML đặc biệt để tránh XSS khi render dữ liệu vào innerHTML.
 * Áp dụng cho mọi dữ liệu từ videos.js trước khi đưa vào DOM.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(str).replace(/[&<>"']/g, (char) => escapeMap[char]);
}

// ─────────────────────────────────────────────
// 6. KHỞI CHẠY
// ─────────────────────────────────────────────

// Chờ DOM parse xong mới chạy — an toàn hơn load event
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM đã sẵn sàng (script defer hoặc module type tự defer)
  initApp();
}
