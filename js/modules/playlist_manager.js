/**
 * playlist-manager.js
 * -------------------
 * Module điều phối việc phát video và quản lý trạng thái playlist.
 *
 * Chịu trách nhiệm:
 *   - Theo dõi video đang phát hiện tại
 *   - Điều phối chuyển bài: next, previous, goToStart, playVideo
 *   - Cập nhật trạng thái active trên DOM (card, playlist section)
 *   - Kết nối với youtube-player.js để thực sự phát video
 *
 * KHÔNG chịu trách nhiệm:
 *   - Render HTML (đó là nhiệm vụ của main.js)
 *   - Tương tác trực tiếp với YouTube API (đó là youtube-player.js)
 *   - Tìm kiếm (đó là search.js)
 */

import {
  getNextVideo,
  getPreviousVideo,
  getFirstVideo,
  getVideoById,
} from "../data/videos.js";

import {
  createPlayer,
  loadVideo,
  onVideoEnded,
  onStateChange,
  PLAYER_STATE,
} from "./youtube-player.js";

// ─────────────────────────────────────────────
// 1. TRẠNG THÁI NỘI BỘ
// ─────────────────────────────────────────────

/**
 * ID của video đang phát hiện tại.
 * @type {string | null}
 */
let currentVideoId = null;

/**
 * Cờ đánh dấu player đã được khởi tạo lần đầu chưa.
 * @type {boolean}
 */
let isPlayerInitialized = false;

/**
 * Callback bên ngoài đăng ký để nhận thông báo khi video thay đổi.
 * ui-controls.js dùng để cập nhật nút pause/play.
 * @type {Function | null}
 */
let onVideoChangedCallback = null;

// ─────────────────────────────────────────────
// 2. KHỞI TẠO
// ─────────────────────────────────────────────

/**
 * Khởi tạo playlist manager.
 * Đăng ký lắng nghe sự kiện từ youtube-player.
 * Gọi 1 lần duy nhất từ main.js.
 */
function init() {
  // Khi video kết thúc → tự động phát video tiếp theo
  onVideoEnded(handleVideoEnded);

  // Khi trạng thái player thay đổi → cập nhật UI
  onStateChange(handlePlayerStateChange);
}

// ─────────────────────────────────────────────
// 3. PHÁT VIDEO
// ─────────────────────────────────────────────

/**
 * Phát một video theo ID.
 * Nếu player chưa khởi tạo → tạo mới player trong iframe của video đó.
 * Nếu player đã có → dùng loadVideo() để chuyển bài nhanh hơn.
 *
 * @param {string} videoId - YouTube video ID
 */
function playVideo(videoId) {
  const entry = getVideoById(videoId);
  if (!entry) {
    console.warn(`[PlaylistManager] Không tìm thấy video: ${videoId}`);
    return;
  }

  const previousVideoId = currentVideoId;
  currentVideoId = videoId;

  if (!isPlayerInitialized) {
    // Lần đầu: tạo player mới trong iframe của card này
    const iframeId = getIframeId(videoId);
    createPlayer(iframeId, videoId, () => {
      isPlayerInitialized = true;
    });
  } else {
    // Đã có player: load video mới vào player hiện tại,
    // rồi di chuyển player DOM vào iframe của card mới
    movePlayerToCard(videoId);
    loadVideo(videoId);
  }

  // Cập nhật trạng thái active trên DOM
  updateActiveCard(previousVideoId, videoId);
  updateActivePlaylist(videoId);

  // Thông báo cho các module khác
  if (typeof onVideoChangedCallback === "function") {
    onVideoChangedCallback(videoId, entry.playlistId);
  }
}

/**
 * Di chuyển iframe player sang card mới.
 * YouTube player gắn vào một iframe cụ thể trong DOM.
 * Khi chuyển bài, cần đảm bảo iframe đúng card được dùng.
 *
 * @param {string} videoId
 */
function movePlayerToCard(videoId) {
  // Tìm iframe của card mới
  const targetCard = document.querySelector(
    `.video-card[data-video-id="${videoId}"]`,
  );
  if (!targetCard) return;

  const targetIframe = targetCard.querySelector(".video-card__iframe");
  if (!targetIframe) return;

  // Đảm bảo iframe có đúng ID để player có thể gắn vào
  targetIframe.id = getIframeId(videoId);
}

// ─────────────────────────────────────────────
// 4. ĐIỀU HƯỚNG: NEXT / PREVIOUS / GO TO START
// ─────────────────────────────────────────────

/**
 * Phát video tiếp theo trong danh sách phẳng.
 */
function playNextVideo() {
  if (!currentVideoId) {
    playVideo(getFirstVideo().id);
    return;
  }
  const nextVideo = getNextVideo(currentVideoId);
  playVideo(nextVideo.id);
}

/**
 * Phát video trước đó trong danh sách phẳng.
 */
function playPreviousVideo() {
  if (!currentVideoId) {
    playVideo(getFirstVideo().id);
    return;
  }
  const previousVideo = getPreviousVideo(currentVideoId);
  playVideo(previousVideo.id);
}

/**
 * Quay về video đầu tiên trong toàn bộ danh sách.
 */
function goToStart() {
  const firstVideo = getFirstVideo();
  playVideo(firstVideo.id);
}

/**
 * Lấy ID của video đang phát.
 * @returns {string | null}
 */
function getCurrentVideoId() {
  return currentVideoId;
}

// ─────────────────────────────────────────────
// 5. XỬ LÝ SỰ KIỆN TỪ YOUTUBE PLAYER
// ─────────────────────────────────────────────

/**
 * Xử lý khi video kết thúc.
 * Tự động chuyển sang video tiếp theo.
 */
function handleVideoEnded() {
  playNextVideo();
}

/**
 * Xử lý khi trạng thái player thay đổi.
 * Cập nhật icon pause/play trên nút điều khiển.
 *
 * @param {number} state - YT.PlayerState value
 */
function handlePlayerStateChange(state) {
  const pausePlayBtn = document.getElementById("btn-pause-play");
  if (!pausePlayBtn) return;

  if (state === PLAYER_STATE.PLAYING) {
    pausePlayBtn.dataset.state = "playing";
  } else if (state === PLAYER_STATE.PAUSED || state === PLAYER_STATE.ENDED) {
    pausePlayBtn.dataset.state = "paused";
  }
}

// ─────────────────────────────────────────────
// 6. CẬP NHẬT TRẠNG THÁI DOM
// ─────────────────────────────────────────────

/**
 * Cập nhật class active trên video card.
 * Xóa active khỏi card cũ, thêm vào card mới.
 *
 * @param {string | null} previousVideoId
 * @param {string}        newVideoId
 */
function updateActiveCard(previousVideoId, newVideoId) {
  // Xóa active khỏi card cũ
  if (previousVideoId) {
    const previousCard = document.querySelector(
      `.video-card[data-video-id="${previousVideoId}"]`,
    );
    if (previousCard) {
      previousCard.classList.remove("video-card--active");
    }
  }

  // Thêm active vào card mới
  const newCard = document.querySelector(
    `.video-card[data-video-id="${newVideoId}"]`,
  );
  if (newCard) {
    newCard.classList.add("video-card--active");

    // Scroll card vào vùng nhìn thấy nếu đang ngoài màn hình
    newCard.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}

/**
 * Cập nhật class active trên playlist section.
 * Đánh dấu playlist nào đang có video được phát.
 *
 * @param {string} videoId
 */
function updateActivePlaylist(videoId) {
  const entry = getVideoById(videoId);
  if (!entry) return;

  const { playlistId } = entry;

  // Xóa active khỏi tất cả playlist
  document.querySelectorAll(".playlist-section--active").forEach((section) => {
    section.classList.remove("playlist-section--active");
  });

  // Thêm active vào playlist đang phát
  const activeSection = document.getElementById(`playlist-${playlistId}`);
  if (activeSection) {
    activeSection.classList.add("playlist-section--active");
  }
}

// ─────────────────────────────────────────────
// 7. TIỆN ÍCH NỘI BỘ
// ─────────────────────────────────────────────

/**
 * Tạo ID chuẩn cho iframe element của một video.
 * Đảm bảo nhất quán giữa JS render và player gắn vào.
 *
 * @param {string} videoId
 * @returns {string}
 */
function getIframeId(videoId) {
  return `youtube-iframe-${videoId}`;
}

// ─────────────────────────────────────────────
// 8. ĐĂNG KÝ CALLBACK TỪ BÊN NGOÀI
// ─────────────────────────────────────────────

/**
 * Đăng ký callback được gọi khi video đang phát thay đổi.
 *
 * @param {Function} callback - Nhận (videoId, playlistId)
 */
function onVideoChanged(callback) {
  onVideoChangedCallback = callback;
}

// ─────────────────────────────────────────────
// 9. PUBLIC API
// ─────────────────────────────────────────────

export {
  init,
  playVideo,
  playNextVideo,
  playPreviousVideo,
  goToStart,
  getCurrentVideoId,
  onVideoChanged,
  getIframeId,
};
