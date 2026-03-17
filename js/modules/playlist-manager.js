/**
 * playlist-manager.js
 * -------------------
 * Module điều phối việc phát video và quản lý trạng thái playlist.
 *
 * Kiến trúc: 1 YouTube Player duy nhất gắn vào #main-youtube-player
 * trong index.html. Các video card chỉ là thumbnail/thông tin —
 * click vào card sẽ load video đó vào player cố định, không phát
 * trong iframe riêng của từng card.
 */

import {
  getNextVideo,
  getPreviousVideo,
  getFirstVideo,
  getVideoById,
} from '../data/videos.js';

import {
  createPlayer,
  loadVideo,
  onVideoEnded,
  onStateChange,
  PLAYER_STATE,
} from './youtube-player.js';


// ─────────────────────────────────────────────
// 1. HẰNG SỐ
// ─────────────────────────────────────────────

/** ID của iframe player cố định trong DOM */
const MAIN_PLAYER_IFRAME_ID = 'main-youtube-player';


// ─────────────────────────────────────────────
// 2. TRẠNG THÁI NỘI BỘ
// ─────────────────────────────────────────────

/** @type {string | null} */
let currentVideoId = null;

/** @type {boolean} */
let isPlayerInitialized = false;

/** @type {Function | null} */
let onVideoChangedCallback = null;


// ─────────────────────────────────────────────
// 3. KHỞI TẠO
// ─────────────────────────────────────────────

function init() {
  onVideoEnded(handleVideoEnded);
  onStateChange(handlePlayerStateChange);
}


// ─────────────────────────────────────────────
// 4. PHÁT VIDEO
// ─────────────────────────────────────────────

/**
 * Phát một video theo ID vào player cố định.
 * @param {string} videoId
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
    // Lần đầu: tạo player trong iframe cố định
    createPlayer(MAIN_PLAYER_IFRAME_ID, videoId, () => {
      isPlayerInitialized = true;
    });
  } else {
    // Đã có player: chỉ load video mới vào player hiện tại
    loadVideo(videoId);
  }

  // Cập nhật trạng thái active trên DOM
  updateActiveCard(previousVideoId, videoId);
  updateActivePlaylist(videoId);

  // Cập nhật thông tin bài đang phát trên player bar
  updatePlayerInfo(videoId);

  if (typeof onVideoChangedCallback === 'function') {
    onVideoChangedCallback(videoId, entry.playlistId);
  }
}

function playNextVideo() {
  if (!currentVideoId) { playVideo(getFirstVideo().id); return; }
  playVideo(getNextVideo(currentVideoId).id);
}

function playPreviousVideo() {
  if (!currentVideoId) { playVideo(getFirstVideo().id); return; }
  playVideo(getPreviousVideo(currentVideoId).id);
}

function goToStart() {
  playVideo(getFirstVideo().id);
}

function getCurrentVideoId() {
  return currentVideoId;
}


// ─────────────────────────────────────────────
// 5. CẬP NHẬT THÔNG TIN PLAYER BAR
// ─────────────────────────────────────────────

/**
 * Cập nhật tên bài hát và ca sĩ hiển thị trên header.
 * @param {string} videoId
 */
function updatePlayerInfo(videoId) {
  const entry = getVideoById(videoId);
  if (!entry) return;

  const titleEl  = document.getElementById('player-bar-title');
  const artistEl = document.getElementById('player-bar-artist');

  if (titleEl)  titleEl.textContent  = entry.video.title;
  if (artistEl) artistEl.textContent = entry.video.artist;
}


// ─────────────────────────────────────────────
// 6. XỬ LÝ SỰ KIỆN TỪ YOUTUBE PLAYER
// ─────────────────────────────────────────────

function handleVideoEnded() {
  playNextVideo();
}

function handlePlayerStateChange(state) {
  const pausePlayBtn = document.getElementById('btn-pause-play');
  if (!pausePlayBtn) return;

  if (state === PLAYER_STATE.PLAYING) {
    pausePlayBtn.dataset.state = 'playing';
  } else if (state === PLAYER_STATE.PAUSED || state === PLAYER_STATE.ENDED) {
    pausePlayBtn.dataset.state = 'paused';
  }
}


// ─────────────────────────────────────────────
// 7. CẬP NHẬT TRẠNG THÁI DOM
// ─────────────────────────────────────────────

function updateActiveCard(previousVideoId, newVideoId) {
  if (previousVideoId) {
    const prev = document.querySelector(`.video-card[data-video-id="${previousVideoId}"]`);
    if (prev) prev.classList.remove('video-card--active');
  }

  const newCard = document.querySelector(`.video-card[data-video-id="${newVideoId}"]`);
  if (newCard) {
    newCard.classList.add('video-card--active');
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function updateActivePlaylist(videoId) {
  const entry = getVideoById(videoId);
  if (!entry) return;

  document.querySelectorAll('.playlist-section--active').forEach((s) => {
    s.classList.remove('playlist-section--active');
  });

  const activeSection = document.getElementById(`playlist-${entry.playlistId}`);
  if (activeSection) activeSection.classList.add('playlist-section--active');
}


// ─────────────────────────────────────────────
// 8. CALLBACK
// ─────────────────────────────────────────────

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
};
