/**
 * search.js
 * ---------
 * Module xử lý toàn bộ tính năng tìm kiếm video.
 *
 * Chịu trách nhiệm:
 *   - Lắng nghe sự kiện submit form tìm kiếm
 *   - Gọi searchVideos() từ videos.js để lấy kết quả
 *   - Render kết quả vào #search-results-grid
 *   - Hiển thị / ẩn vùng kết quả tìm kiếm
 *   - Scroll đến video trong danh sách nếu tìm thấy đúng 1 kết quả
 *   - Xử lý nút đóng kết quả tìm kiếm
 *
 * KHÔNG chịu trách nhiệm:
 *   - Logic tìm kiếm thực sự (đó là searchVideos() trong videos.js)
 *   - Phát video (đó là playlist-manager.js)
 *   - Render card video đầy đủ (dùng lại hàm từ main.js)
 */

import { searchVideos } from "../data/videos.js";

// ─────────────────────────────────────────────
// 1. CACHE DOM ELEMENTS
// ─────────────────────────────────────────────

/**
 * Lấy và cache các DOM element dùng trong module.
 * Gọi 1 lần khi init, tránh querySelector lặp đi lặp lại.
 */
let elements = null;

function getElements() {
  if (elements) return elements;

  elements = {
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchResults: document.getElementById("search-results"),
    resultsGrid: document.getElementById("search-results-grid"),
    resultsKeyword: document.getElementById("search-results-keyword"),
    closeBtn: document.getElementById("btn-close-search"),
  };

  return elements;
}

// ─────────────────────────────────────────────
// 2. TRẠNG THÁI NỘI BỘ
// ─────────────────────────────────────────────

/**
 * Từ khóa tìm kiếm hiện tại.
 * @type {string}
 */
let currentKeyword = "";

/**
 * Callback để render một video card.
 * Được inject từ main.js để tái sử dụng hàm render chung.
 * @type {Function | null}
 */
let renderVideoCardCallback = null;

/**
 * Callback để phát video khi click vào kết quả tìm kiếm.
 * @type {Function | null}
 */
let playVideoCallback = null;

// ─────────────────────────────────────────────
// 3. KHỞI TẠO
// ─────────────────────────────────────────────

/**
 * Khởi tạo module tìm kiếm.
 * Đăng ký các event listener.
 * Gọi 1 lần duy nhất từ main.js.
 *
 * @param {Object}   options
 * @param {Function} options.onRenderCard  - Hàm render 1 video card, nhận (video, playlistId)
 * @param {Function} options.onPlayVideo   - Hàm phát video, nhận (videoId)
 */
function init({ onRenderCard, onPlayVideo }) {
  renderVideoCardCallback = onRenderCard;
  playVideoCallback = onPlayVideo;

  const els = getElements();

  // Lắng nghe submit form (Enter hoặc click nút tìm)
  els.searchForm.addEventListener("submit", handleSearchSubmit);

  // Lắng nghe nút đóng kết quả
  els.closeBtn.addEventListener("click", closeSearchResults);

  // Phím Escape đóng kết quả tìm kiếm
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isSearchResultsVisible()) {
      closeSearchResults();
    }
  });
}

// ─────────────────────────────────────────────
// 4. XỬ LÝ TÌM KIẾM
// ─────────────────────────────────────────────

/**
 * Xử lý sự kiện submit form tìm kiếm.
 * @param {Event} event
 */
function handleSearchSubmit(event) {
  event.preventDefault();

  const els = getElements();
  const keyword = els.searchInput.value.trim();

  if (!keyword) {
    closeSearchResults();
    return;
  }

  executeSearch(keyword);
}

/**
 * Thực hiện tìm kiếm và hiển thị kết quả.
 *
 * @param {string} keyword
 */
function executeSearch(keyword) {
  currentKeyword = keyword;

  const results = searchVideos(keyword);

  if (results.length === 0) {
    showEmptyResults(keyword);
    return;
  }

  // Nếu tìm thấy đúng 1 kết quả → scroll đến card đó trong danh sách
  if (results.length === 1) {
    scrollToVideoCard(results[0].video.id);
    highlightVideoCard(results[0].video.id);
    return;
  }

  // Nhiều kết quả → hiển thị grid kết quả
  showResults(keyword, results);
}

/**
 * Hiển thị danh sách kết quả tìm kiếm.
 *
 * @param {string} keyword
 * @param {Array<{ video: Video, playlistId: string }>} results
 */
function showResults(keyword, results) {
  const els = getElements();

  // Cập nhật từ khóa hiển thị
  els.resultsKeyword.textContent = `"${keyword}"`;

  // Xóa kết quả cũ
  els.resultsGrid.innerHTML = "";

  // Xóa các trạng thái cũ
  els.resultsGrid.classList.remove("video-grid--empty", "video-grid--error");

  // Render từng card kết quả
  results.forEach(({ video, playlistId }, index) => {
    const card = renderVideoCardCallback(video, playlistId);

    // Gán index để stagger animation hoạt động
    card.style.setProperty("--card-index", index);

    // Click vào card kết quả → phát video đó
    card.addEventListener("click", () => {
      if (typeof playVideoCallback === "function") {
        playVideoCallback(video.id);
      }
    });

    els.resultsGrid.appendChild(card);
  });

  // Hiện vùng kết quả
  els.searchResults.removeAttribute("hidden");

  // Scroll lên đầu vùng kết quả
  els.searchResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hiển thị thông báo không tìm thấy kết quả.
 *
 * @param {string} keyword
 */
function showEmptyResults(keyword) {
  const els = getElements();

  els.resultsKeyword.textContent = `"${keyword}"`;
  els.resultsGrid.innerHTML = "";
  els.resultsGrid.classList.add("video-grid--empty");

  // Render empty state
  els.resultsGrid.innerHTML = `
    <div class="video-grid__empty-message">
      <span class="video-grid__empty-icon">🔍</span>
      <p class="video-grid__empty-title">Không tìm thấy kết quả</p>
      <p class="video-grid__empty-subtitle">
        Không có bài hát nào khớp với từ khóa "${keyword}".
        Thử tìm bằng tên ca sĩ hoặc thể loại nhạc.
      </p>
    </div>
  `;

  els.searchResults.removeAttribute("hidden");
  els.searchResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Đóng và ẩn vùng kết quả tìm kiếm.
 */
function closeSearchResults() {
  const els = getElements();

  // Ẩn vùng kết quả
  els.searchResults.setAttribute("hidden", "");

  // Xóa nội dung để giải phóng DOM
  els.resultsGrid.innerHTML = "";
  els.resultsGrid.classList.remove("video-grid--empty", "video-grid--error");

  // Xóa text trong ô tìm kiếm
  els.searchInput.value = "";
  currentKeyword = "";

  // Trả focus về ô tìm kiếm
  els.searchInput.focus();
}

// ─────────────────────────────────────────────
// 5. SCROLL & HIGHLIGHT
// ─────────────────────────────────────────────

/**
 * Scroll đến card video trong danh sách playlist.
 * Dùng khi tìm kiếm ra đúng 1 kết quả.
 *
 * @param {string} videoId
 */
function scrollToVideoCard(videoId) {
  const card = document.querySelector(
    `.video-card[data-video-id="${videoId}"]`,
  );
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Highlight tạm thời card video để người dùng dễ nhận ra.
 * Highlight tự động tắt sau 2 giây.
 *
 * @param {string} videoId
 */
function highlightVideoCard(videoId) {
  const card = document.querySelector(
    `.video-card[data-video-id="${videoId}"]`,
  );
  if (!card) return;

  // Thêm class highlight
  card.classList.add("video-card--highlight");

  // Tự động xóa sau 2 giây
  setTimeout(() => {
    card.classList.remove("video-card--highlight");
  }, 2000);
}

// ─────────────────────────────────────────────
// 6. TIỆN ÍCH
// ─────────────────────────────────────────────

/**
 * Kiểm tra vùng kết quả tìm kiếm có đang hiển thị không.
 * @returns {boolean}
 */
function isSearchResultsVisible() {
  const els = getElements();
  return !els.searchResults.hasAttribute("hidden");
}

/**
 * Lấy từ khóa tìm kiếm hiện tại.
 * @returns {string}
 */
function getCurrentKeyword() {
  return currentKeyword;
}

// ─────────────────────────────────────────────
// 7. PUBLIC API
// ─────────────────────────────────────────────

export {
  init,
  executeSearch,
  closeSearchResults,
  isSearchResultsVisible,
  getCurrentKeyword,
};
