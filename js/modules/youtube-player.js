/**
 * youtube-player.js
 * -----------------
 * Module quản lý YouTube IFrame Player API.
 *
 * Cách đúng để khởi tạo player:
 *   - Dùng một <div> làm container (không phải <iframe>)
 *   - YouTube API tự tạo iframe bên trong div đó
 *   - Sau khi tạo xong, chỉ dùng loadVideoById() — KHÔNG destroy
 */


// ─────────────────────────────────────────────
// 1. TRẠNG THÁI NỘI BỘ
// ─────────────────────────────────────────────

/** @type {YT.Player | null} */
let playerInstance = null;

/** @type {Function | null} */
let onVideoEndedCallback = null;

/** @type {Function | null} */
let onStateChangeCallback = null;

/** @type {boolean} */
let isApiReady = false;

/** @type {Function[]} */
const pendingActions = [];


// ─────────────────────────────────────────────
// 2. LOAD YOUTUBE API
// ─────────────────────────────────────────────

function loadYouTubeApi() {
  if (document.getElementById('youtube-iframe-api-script')) return;

  window.onYouTubeIframeAPIReady = handleApiReady;

  const script    = document.createElement('script');
  script.id       = 'youtube-iframe-api-script';
  script.src      = 'https://www.youtube.com/iframe_api';

  const first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(script, first);
}

function handleApiReady() {
  isApiReady = true;
  pendingActions.forEach((fn) => fn());
  pendingActions.length = 0;
}

function runWhenApiReady(fn) {
  if (isApiReady) {
    fn();
  } else {
    pendingActions.push(fn);
  }
}


// ─────────────────────────────────────────────
// 3. TẠO PLAYER — 1 lần duy nhất
// ─────────────────────────────────────────────

/**
 * Tạo YouTube Player bên trong một <div> container.
 * YouTube API tự tạo iframe bên trong div đó.
 *
 * QUAN TRỌNG: Dùng div làm container, không dùng iframe trực tiếp.
 * Điều này đảm bảo YouTube API hoạt động đúng 100%.
 *
 * @param {string}   containerId - ID của <div> container trong DOM
 * @param {string}   videoId     - Video đầu tiên cần phát
 * @param {Function} onReady     - Callback khi player sẵn sàng
 */
function createPlayer(containerId, videoId, onReady) {
  // Nếu player đã tồn tại → chỉ load video mới
  if (playerInstance) {
    loadVideo(videoId);
    return;
  }

  runWhenApiReady(() => {
    playerInstance = new YT.Player(containerId, {
      videoId,
      width:  '100%',
      height: '100%',
      playerVars: {
        autoplay:       1,
        controls:       1,
        rel:            0,
        modestbranding: 1,
        enablejsapi:    1,
        origin:         window.location.origin,
      },
      events: {
        onReady(event) {
          if (typeof onReady === 'function') onReady(event);
        },
        onStateChange: handlePlayerStateChange,
        onError:       handlePlayerError,
      },
    });
  });
}


// ─────────────────────────────────────────────
// 4. XỬ LÝ SỰ KIỆN
// ─────────────────────────────────────────────

function handlePlayerStateChange(event) {
  const state = event.data;

  if (typeof onStateChangeCallback === 'function') {
    onStateChangeCallback(state);
  }

  if (state === YT.PlayerState.ENDED) {
    if (typeof onVideoEndedCallback === 'function') {
      onVideoEndedCallback();
    }
  }
}

function handlePlayerError(event) {
  const messages = {
    2:   'Video ID không hợp lệ.',
    5:   'Trình duyệt không hỗ trợ video này.',
    100: 'Video không tồn tại hoặc đã bị xóa.',
    101: 'Video không được phép nhúng.',
    150: 'Video không được phép nhúng.',
  };
  console.warn(`[YouTubePlayer] ${messages[event.data] || `Lỗi code: ${event.data}`}`);

  // Lỗi → skip sang bài tiếp
  if (typeof onVideoEndedCallback === 'function') {
    onVideoEndedCallback();
  }
}


// ─────────────────────────────────────────────
// 5. ĐIỀU KHIỂN PLAYER
// ─────────────────────────────────────────────

function play() {
  if (playerInstance) playerInstance.playVideo();
}

function pause() {
  if (playerInstance) playerInstance.pauseVideo();
}

function togglePlayPause() {
  if (!playerInstance) return;
  if (playerInstance.getPlayerState() === YT.PlayerState.PLAYING) {
    pause();
  } else {
    play();
  }
}

/**
 * Load và phát video mới — KHÔNG tạo lại player.
 * @param {string} videoId
 */
function loadVideo(videoId) {
  if (playerInstance) {
    playerInstance.loadVideoById(videoId);
  }
}

function isPlaying() {
  if (!playerInstance) return false;
  return playerInstance.getPlayerState() === YT.PlayerState.PLAYING;
}

function getPlayerState() {
  if (!playerInstance) return -1;
  return playerInstance.getPlayerState();
}


// ─────────────────────────────────────────────
// 6. CALLBACK
// ─────────────────────────────────────────────

function onVideoEnded(callback)  { onVideoEndedCallback  = callback; }
function onStateChange(callback) { onStateChangeCallback = callback; }


// ─────────────────────────────────────────────
// 7. HẰNG SỐ
// ─────────────────────────────────────────────

const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED:      0,
  PLAYING:    1,
  PAUSED:     2,
  BUFFERING:  3,
  CUED:       5,
};


// ─────────────────────────────────────────────
// 8. PUBLIC API
// ─────────────────────────────────────────────

export {
  loadYouTubeApi,
  createPlayer,
  play,
  pause,
  togglePlayPause,
  loadVideo,
  isPlaying,
  getPlayerState,
  onVideoEnded,
  onStateChange,
  PLAYER_STATE,
};
