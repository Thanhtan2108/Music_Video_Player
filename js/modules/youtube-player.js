/**
 * youtube-player.js
 * -----------------
 * Module quản lý YouTube IFrame Player API.
 * Chịu trách nhiệm duy nhất: giao tiếp với YouTube API.
 *
 * Cách hoạt động:
 *   1. Load YouTube IFrame API script vào trang (1 lần duy nhất)
 *   2. Khi API sẵn sàng → gọi callback onApiReady
 *   3. Tạo player instance gắn vào iframe có sẵn trong DOM
 *   4. Lắng nghe sự kiện từ player (playing, paused, ended...)
 *   5. Expose các hàm điều khiển: play, pause, loadVideo
 *
 * Module này KHÔNG biết gì về playlist, search, hay UI khác.
 * Nó chỉ biết: "có một video đang phát trong một iframe".
 * Mọi logic điều phối nằm ở playlist-manager.js và main.js.
 */


// ─────────────────────────────────────────────
// 1. TRẠNG THÁI NỘI BỘ
// ─────────────────────────────────────────────

/**
 * Instance YT.Player hiện tại.
 * @type {YT.Player | null}
 */
let playerInstance = null;

/**
 * ID của iframe element mà player đang gắn vào.
 * @type {string | null}
 */
let currentIframeId = null;

/**
 * Callback được gọi khi player kết thúc 1 video.
 * Được set từ bên ngoài qua onVideoEnded().
 * @type {Function | null}
 */
let onVideoEndedCallback = null;

/**
 * Callback được gọi khi trạng thái player thay đổi.
 * @type {Function | null}
 */
let onStateChangeCallback = null;

/**
 * Cờ đánh dấu YouTube API đã sẵn sàng chưa.
 * @type {boolean}
 */
let isApiReady = false;

/**
 * Hàng đợi các hành động chờ API sẵn sàng.
 * @type {Function[]}
 */
const pendingActions = [];


// ─────────────────────────────────────────────
// 2. KHỞI TẠO YOUTUBE API
// ─────────────────────────────────────────────

/**
 * Load YouTube IFrame API script vào trang.
 * Chỉ load 1 lần — gọi nhiều lần vẫn an toàn.
 *
 * YouTube API yêu cầu hàm toàn cục `window.onYouTubeIframeAPIReady`
 * được định nghĩa TRƯỚC khi script load xong.
 */
function loadYouTubeApi() {
  // Nếu đã load rồi thì bỏ qua
  if (document.getElementById('youtube-iframe-api-script')) return;

  // Định nghĩa callback toàn cục mà YouTube API sẽ gọi khi sẵn sàng
  window.onYouTubeIframeAPIReady = handleApiReady;

  // Tạo và inject script tag
  const script = document.createElement('script');
  script.id  = 'youtube-iframe-api-script';
  script.src = 'https://www.youtube.com/iframe_api';

  // Inject vào đầu document
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
}

/**
 * Xử lý khi YouTube API đã sẵn sàng.
 * Được gọi tự động bởi YouTube sau khi script load xong.
 */
function handleApiReady() {
  isApiReady = true;

  // Thực thi tất cả các hành động đang chờ trong hàng đợi
  pendingActions.forEach((action) => action());
  pendingActions.length = 0;
}

/**
 * Chạy một hành động ngay nếu API đã sẵn sàng,
 * hoặc đưa vào hàng đợi để chạy sau.
 *
 * @param {Function} action
 */
function runWhenApiReady(action) {
  if (isApiReady) {
    action();
  } else {
    pendingActions.push(action);
  }
}


// ─────────────────────────────────────────────
// 3. TẠO VÀ QUẢN LÝ PLAYER
// ─────────────────────────────────────────────

/**
 * Tạo một YouTube Player instance mới gắn vào iframe.
 *
 * @param {string}   iframeId  - ID của thẻ <iframe> trong DOM
 * @param {string}   videoId   - YouTube video ID để phát đầu tiên
 * @param {Function} onReady   - Callback khi player sẵn sàng
 */
function createPlayer(iframeId, videoId, onReady) {
  runWhenApiReady(() => {
    // Hủy player cũ nếu tồn tại
    destroyPlayer();

    currentIframeId = iframeId;

    playerInstance = new YT.Player(iframeId, {
      videoId,
      playerVars: {
        autoplay:       1,   // tự phát khi load
        controls:       1,   // hiện controls của YouTube
        rel:            0,   // không gợi ý video liên quan khi kết thúc
        modestbranding: 1,   // ẩn logo YouTube lớn
        enablejsapi:    1,   // bắt buộc để dùng JS API
        origin:         window.location.origin,
      },
      events: {
        onReady:       handlePlayerReady(onReady),
        onStateChange: handlePlayerStateChange,
        onError:       handlePlayerError,
      },
    });
  });
}

/**
 * Hủy player hiện tại và giải phóng bộ nhớ.
 */
function destroyPlayer() {
  if (playerInstance) {
    try {
      playerInstance.destroy();
    } catch {
      // Bỏ qua lỗi nếu player đã bị destroy trước đó
    }
    playerInstance = null;
    currentIframeId = null;
  }
}


// ─────────────────────────────────────────────
// 4. XỬ LÝ SỰ KIỆN TỪ PLAYER
// ─────────────────────────────────────────────

/**
 * Tạo handler cho sự kiện onReady của player.
 *
 * @param {Function | undefined} externalOnReady - Callback từ bên ngoài
 * @returns {Function}
 */
function handlePlayerReady(externalOnReady) {
  return function (event) {
    if (typeof externalOnReady === 'function') {
      externalOnReady(event);
    }
  };
}

/**
 * Xử lý khi trạng thái player thay đổi.
 * Các trạng thái của YT.PlayerState:
 *   -1 = UNSTARTED
 *    0 = ENDED
 *    1 = PLAYING
 *    2 = PAUSED
 *    3 = BUFFERING
 *    5 = VIDEO_CUED
 *
 * @param {Object} event - YouTube player state change event
 */
function handlePlayerStateChange(event) {
  const state = event.data;

  // Gọi callback bên ngoài để UI cập nhật
  if (typeof onStateChangeCallback === 'function') {
    onStateChangeCallback(state);
  }

  // Khi video kết thúc → báo cho playlist-manager tự phát video tiếp
  if (state === YT.PlayerState.ENDED) {
    if (typeof onVideoEndedCallback === 'function') {
      onVideoEndedCallback();
    }
  }
}

/**
 * Xử lý lỗi từ player.
 * Mã lỗi YouTube:
 *   2  = videoId không hợp lệ
 *   5  = lỗi HTML5 player
 *   100 = video không tồn tại hoặc bị xóa
 *   101/150 = video không cho phép nhúng
 *
 * @param {Object} event - YouTube player error event
 */
function handlePlayerError(event) {
  const errorCode = event.data;

  const errorMessages = {
    2:   'Video ID không hợp lệ.',
    5:   'Trình duyệt không hỗ trợ video này.',
    100: 'Video không tồn tại hoặc đã bị xóa.',
    101: 'Video không được phép nhúng.',
    150: 'Video không được phép nhúng.',
  };

  const message = errorMessages[errorCode] || `Lỗi không xác định (code: ${errorCode})`;
  console.warn(`[YouTubePlayer] Lỗi player: ${message}`);

  // Khi có lỗi → tự động chuyển sang video tiếp theo
  if (typeof onVideoEndedCallback === 'function') {
    onVideoEndedCallback();
  }
}


// ─────────────────────────────────────────────
// 5. ĐIỀU KHIỂN PLAYER — PUBLIC API
// ─────────────────────────────────────────────

/**
 * Phát video.
 */
function play() {
  if (playerInstance) {
    playerInstance.playVideo();
  }
}

/**
 * Tạm dừng video.
 */
function pause() {
  if (playerInstance) {
    playerInstance.pauseVideo();
  }
}

/**
 * Toggle giữa play và pause.
 */
function togglePlayPause() {
  if (!playerInstance) return;

  const state = playerInstance.getPlayerState();

  if (state === YT.PlayerState.PLAYING) {
    pause();
  } else {
    play();
  }
}

/**
 * Load và phát một video mới trong player hiện tại.
 * Không cần tạo lại player — nhanh hơn createPlayer().
 *
 * @param {string} videoId - YouTube video ID
 */
function loadVideo(videoId) {
  if (playerInstance) {
    playerInstance.loadVideoById(videoId);
  }
}

/**
 * Kiểm tra player hiện tại có đang phát không.
 *
 * @returns {boolean}
 */
function isPlaying() {
  if (!playerInstance) return false;
  return playerInstance.getPlayerState() === YT.PlayerState.PLAYING;
}

/**
 * Lấy trạng thái hiện tại của player.
 * Trả về số nguyên theo chuẩn YT.PlayerState, hoặc -1 nếu chưa có player.
 *
 * @returns {number}
 */
function getPlayerState() {
  if (!playerInstance) return -1;
  return playerInstance.getPlayerState();
}


// ─────────────────────────────────────────────
// 6. ĐĂNG KÝ CALLBACK TỪ BÊN NGOÀI
// ─────────────────────────────────────────────

/**
 * Đăng ký callback được gọi khi video kết thúc.
 * playlist-manager.js dùng hàm này để phát video tiếp theo.
 *
 * @param {Function} callback
 */
function onVideoEnded(callback) {
  onVideoEndedCallback = callback;
}

/**
 * Đăng ký callback được gọi khi trạng thái player thay đổi.
 * ui-controls.js dùng hàm này để cập nhật icon pause/play.
 *
 * @param {Function} callback - Nhận vào số nguyên YT.PlayerState
 */
function onStateChange(callback) {
  onStateChangeCallback = callback;
}


// ─────────────────────────────────────────────
// 7. HẰNG SỐ TRẠNG THÁI — tiện dùng ở module khác
// ─────────────────────────────────────────────

/**
 * Map trạng thái player sang tên dễ đọc.
 * Dùng khi YT global chưa sẵn sàng (vd: khi mới import module).
 */
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
  destroyPlayer,
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
