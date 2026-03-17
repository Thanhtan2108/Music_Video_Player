/**
 * ui-controls.js
 * --------------
 * Module xử lý sự kiện cho 4 nút điều khiển phát nhạc:
 *   - #btn-go-to-start  → về đầu danh sách
 *   - #btn-previous     → video trước
 *   - #btn-pause-play   → tạm dừng / phát
 *   - #btn-next         → video tiếp theo
 *
 * Chịu trách nhiệm:
 *   - Đăng ký event listener cho các nút
 *   - Gọi đúng hàm trong playlist-manager khi nút được click
 *   - Cập nhật trạng thái nút (enabled/disabled) theo ngữ cảnh
 *
 * KHÔNG chịu trách nhiệm:
 *   - Logic phát/dừng video (đó là youtube-player.js)
 *   - Logic chuyển bài (đó là playlist-manager.js)
 *   - Cập nhật icon pause/play (đó là playlist-manager.js qua onStateChange)
 */

import { togglePlayPause } from "./youtube-player.js";

import {
  playNextVideo,
  playPreviousVideo,
  goToStart,
  getCurrentVideoId,
} from "./playlist-manager.js";

// ─────────────────────────────────────────────
// 1. CACHE DOM ELEMENTS
// ─────────────────────────────────────────────

/**
 * Cache các nút điều khiển.
 * @type {Object | null}
 */
let buttons = null;

function getButtons() {
  if (buttons) return buttons;

  buttons = {
    goToStart: document.getElementById("btn-go-to-start"),
    previous: document.getElementById("btn-previous"),
    pausePlay: document.getElementById("btn-pause-play"),
    next: document.getElementById("btn-next"),
  };

  return buttons;
}

// ─────────────────────────────────────────────
// 2. KHỞI TẠO
// ─────────────────────────────────────────────

/**
 * Khởi tạo module điều khiển UI.
 * Đăng ký event listener cho tất cả các nút.
 * Gọi 1 lần duy nhất từ main.js.
 */
function init() {
  const btns = getButtons();

  btns.goToStart.addEventListener("click", handleGoToStart);
  btns.previous.addEventListener("click", handlePrevious);
  btns.pausePlay.addEventListener("click", handlePausePlay);
  btns.next.addEventListener("click", handleNext);

  // Bật hỗ trợ phím tắt bàn phím
  document.addEventListener("keydown", handleKeyboardShortcut);

  // Đặt trạng thái ban đầu: các nút bị disable vì chưa có video nào phát
  setControlsDisabled(true);
}

// ─────────────────────────────────────────────
// 3. XỬ LÝ SỰ KIỆN NÚT
// ─────────────────────────────────────────────

/**
 * Xử lý click nút "Về đầu danh sách".
 */
function handleGoToStart() {
  goToStart();
}

/**
 * Xử lý click nút "Video trước".
 */
function handlePrevious() {
  playPreviousVideo();
}

/**
 * Xử lý click nút "Pause / Play".
 * Nếu chưa có video nào đang phát → phát từ đầu danh sách.
 */
function handlePausePlay() {
  if (!getCurrentVideoId()) {
    goToStart();
    return;
  }
  togglePlayPause();
}

/**
 * Xử lý click nút "Video tiếp theo".
 */
function handleNext() {
  playNextVideo();
}

// ─────────────────────────────────────────────
// 4. PHÍM TẮT BÀN PHÍM
// ─────────────────────────────────────────────

/**
 * Xử lý phím tắt toàn cục.
 *
 * Phím tắt:
 *   Space      → Pause / Play  (chỉ khi không đang focus vào input)
 *   ArrowLeft  → Video trước
 *   ArrowRight → Video tiếp theo
 *   Home       → Về đầu danh sách
 *
 * @param {KeyboardEvent} event
 */
function handleKeyboardShortcut(event) {
  // Không xử lý phím tắt khi đang focus vào ô input hoặc textarea
  const activeTag = document.activeElement?.tagName.toLowerCase();
  if (activeTag === "input" || activeTag === "textarea") return;

  switch (event.key) {
    case " ":
      // Ngăn trang scroll xuống khi bấm Space
      event.preventDefault();
      handlePausePlay();
      break;

    case "ArrowLeft":
      event.preventDefault();
      handlePrevious();
      break;

    case "ArrowRight":
      event.preventDefault();
      handleNext();
      break;

    case "Home":
      event.preventDefault();
      handleGoToStart();
      break;

    default:
      break;
  }
}

// ─────────────────────────────────────────────
// 5. QUẢN LÝ TRẠNG THÁI NÚT
// ─────────────────────────────────────────────

/**
 * Bật hoặc tắt toàn bộ các nút điều khiển.
 * Dùng khi chưa có video nào được chọn (disabled)
 * hoặc khi video bắt đầu phát (enabled).
 *
 * @param {boolean} disabled - true = tắt nút, false = bật nút
 */
function setControlsDisabled(disabled) {
  const btns = getButtons();

  Object.values(btns).forEach((btn) => {
    btn.disabled = disabled;
  });
}

/**
 * Bật toàn bộ nút điều khiển.
 * Gọi từ main.js khi video đầu tiên bắt đầu phát.
 */
function enableControls() {
  setControlsDisabled(false);
}

/**
 * Tắt toàn bộ nút điều khiển.
 * Gọi khi không có video nào khả dụng.
 */
function disableControls() {
  setControlsDisabled(true);
}

// ─────────────────────────────────────────────
// 6. PUBLIC API
// ─────────────────────────────────────────────

export { init, enableControls, disableControls };
