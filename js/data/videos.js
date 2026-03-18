/**
 * videos.js
 * ---------
 * Nguồn dữ liệu trung tâm của toàn bộ ứng dụng.
 * Mọi module khác (player, search, UI) đều đọc từ file này.
 *
 * Cấu trúc:
 *   PLAYLISTS  → mảng các playlist, mỗi playlist chứa nhiều video
 *   VIDEO_MAP  → tra cứu nhanh video theo id (O(1))
 *
 * Khi thêm video mới: chỉ cần chỉnh PLAYLISTS bên dưới,
 * VIDEO_MAP và ALL_VIDEOS_FLAT sẽ tự được build lại.
 */

// ─────────────────────────────────────────────
// 1. CẤU TRÚC DỮ LIỆU (JSDoc typedef)
// ─────────────────────────────────────────────

/**
 * @typedef {Object} Video
 * @property {string}   id       - YouTube video ID (phần sau ?v= trước & trên URL)
 * @property {string}   title    - Tên bài hát
 * @property {string}   artist   - Tên ca sĩ / nghệ sĩ
 * @property {number}   duration - Thời lượng tính bằng giây (0 = chưa biết)
 * @property {string[]} tags     - Nhãn phụ để hỗ trợ tìm kiếm
 */

/**
 * @typedef {Object} Playlist
 * @property {string}   id          - ID định danh playlist (dùng trong DOM/URL)
 * @property {string}   name        - Tên hiển thị
 * @property {string}   description - Mô tả ngắn
 * @property {string}   coverColor  - Màu đại diện (CSS color string)
 * @property {Video[]}  videos      - Danh sách video thuộc playlist này
 */


// ─────────────────────────────────────────────
// 2. DỮ LIỆU PLAYLIST & VIDEO
//    ↓ Chỉ chỉnh sửa ở khu vực này khi thêm/xóa nội dung ↓
// ─────────────────────────────────────────────

/** @type {Playlist[]} */
const PLAYLISTS = [
  // {
  //   id: "nhac-tru-tinh",
  //   name: "Nhạc Trữ Tình",
  //   description: "Những bản nhạc trữ tình Việt Nam bất hủ",
  //   coverColor: "#c0392b",
  //   videos: [
  //     {
  //       id: "dQw4w9WgXcQ",       // ← thay bằng YouTube video ID thực tế
  //       title: "Tên Bài Hát 01",
  //       artist: "Ca sĩ A",
  //       duration: 0,
  //       tags: ["tru tinh", "bolero"],
  //     },
  //   ],
  // },

  // {
  //   id: "nhac-tre",
  //   name: "Nhạc Trẻ",
  //   description: "V-Pop sôi động, năng lượng cao",
  //   coverColor: "#2980b9",
  //   videos: [
  //     {
  //       id: "kJQP7kiw5Fk",
  //       title: "Tên Bài Hát 04",
  //       artist: "Ca sĩ E",
  //       duration: 0,
  //       tags: ["vpop"],
  //     },
  //   ],
  // },

  {
    id: "nhac-tre-remix",
    name: "Nhạc Trẻ Remix",
    description: "Nhạc Trẻ Remix sôi động, giải trí",
    coverColor: "#ae5227",
    videos: [
      {
        id: "WJcQUXC0cMU",
        title: "Gió Remix",
        artist: "JANK",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "CFhEEPG-FiM",
        title: "Hẹn Hò Nhưng Không Yêu Remix",
        artist: "WENDY THẢO",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "TS04y03CEsI",
        title: "Mở Lòng Vì Ai Remix",
        artist: "Inso",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "qkjZSgK6HTo",
        title: "Trả Cho Anh Remix",
        artist: "Nguyễn Thạch Bảo Ngọc",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "QLJLZZgHTGo",
        title: "Lao Tâm Khổ Tứ Remix",
        artist: "Thanh Hưng",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "JFLLHYWkIxc",
        title: "Có Mình Và Ta Remix",
        artist: "Nguyễn Vĩ",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "E4uSPqpq0IA",
        title: "Khó Vẽ Nụ Cười Remix",
        artist: "ĐạtG x DuUyên",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "4LQt5y41Y78",
        title: "Nước Mắt Muộn Màng Remix",
        artist: "Khả Hiệp",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "Y2-QJsbv1WQ",
        title: "Em Của Ngày Hôm Qua Remix",
        artist: "Sơn Tùng M-TP",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "QzYBRb3RgaY",
        title: "Mình Là Người Yêu Cũ Remix",
        artist: "Khả Hiệp",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "03IGoCtHj9U",
        title: "Lý Do Là Gì Remix",
        artist: "Nguyễn Vĩ",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "AuxULopbguY",
        title: "Để Em Lương Thiện Remix",
        artist: "Linh Hương Luz",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "0A6hCfFZVj4",
        title: "Mây x Gió Remix",
        artist: "JANK",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "740fTMOBZdY",
        title: "Cause I Love You Remix",
        artist: "Noo Phước Thịnh",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "eY3d6wthJag",
        title: "Gạt Đi Nước Mắt x Em Của Ngày Hôm Qua",
        artist: "vsic",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "dMtMx_dYk-w",
        title: "Không Bằng Remix",
        artist: "Ngọc Anh",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "wt0k2Dn_4oE",
        title: "Anh Vui Remix",
        artist: "Phạm Kỳ",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "bJa1j2TJ7R4",
        title: "Tấm Lòng Cửu Long Remix",
        artist: "Ricky Star",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "AB-Blzs_ico",
        title: "Nhường Lại Nỗi Đau Remix",
        artist: "Ngân Ngân",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "rU7ncYmbJS0",
        title: "Hoa Tàn Tình Tan Remix",
        artist: "Giang Jolee",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "VpspAxQF2X4",
        title: "Nắng Dưới Chân Mây Remix",
        artist: "Nguyễn Hữu Kha",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "QxYIztwbuUg",
        title: "Chẳng Cần Ngày Mai Remix",
        artist: "Trungg I.U",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "3sg2XLvUlAU",
        title: "Thương Thì Thôi Remix",
        artist: "JANK",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "nmlFrKJLwW0",
        title: "Mưa Rơi Vào Phòng Remix",
        artist: "Khởi My",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
      {
        id: "opu4T76MUps",
        title: "Anh Chẳng Thể Remix",
        artist: "Phạm Kỳ",
        duration: 0,
        tags: ["remix", "entertainment"],
      },
    ],
  },

  // {
  //   id: "nhac-khong-loi",
  //   name: "Nhạc Không Lời",
  //   description: "Nhạc nền thư giãn, tập trung làm việc",
  //   coverColor: "#27ae60",
  //   videos: [
  //     {
  //       id: "hHW1oY26kxQ",
  //       title: "Tên Bài Hát 05",
  //       artist: "Nhạc sĩ F",
  //       duration: 0,
  //       tags: ["instrumental", "relaxing"],
  //     },
  //   ],
  // },
];


// ─────────────────────────────────────────────
// 3. INDEX TRA CỨU NHANH
//    Build tự động từ PLAYLISTS — không cần chỉnh tay
// ─────────────────────────────────────────────

/**
 * VIDEO_MAP: { [videoId]: { video, playlistId } }
 * Tra cứu O(1) thay vì duyệt mảng lồng nhau mỗi lần cần.
 *
 * @type {Object.<string, { video: Video, playlistId: string }>}
 */
const VIDEO_MAP = Object.fromEntries(
  PLAYLISTS.flatMap((playlist) =>
    playlist.videos.map((video) => [
      video.id,
      { video, playlistId: playlist.id },
    ])
  )
);

/**
 * Danh sách phẳng toàn bộ video, theo thứ tự từng playlist.
 * Dùng cho tính năng prev/next xuyên suốt toàn bộ danh sách.
 *
 * @type {Video[]}
 */
const ALL_VIDEOS_FLAT = PLAYLISTS.flatMap((playlist) => playlist.videos);


// ─────────────────────────────────────────────
// 4. HELPER FUNCTIONS
//    Truy xuất dữ liệu thuần túy.
//    Không có side effect, không chạm DOM.
// ─────────────────────────────────────────────

/**
 * Lấy thông tin một playlist theo id.
 * @param {string} playlistId
 * @returns {Playlist | undefined}
 */
function getPlaylistById(playlistId) {
  return PLAYLISTS.find((playlist) => playlist.id === playlistId);
}

/**
 * Lấy thông tin một video theo YouTube video ID.
 * @param {string} videoId
 * @returns {{ video: Video, playlistId: string } | undefined}
 */
function getVideoById(videoId) {
  return VIDEO_MAP[videoId];
}

/**
 * Tìm kiếm video theo từ khóa.
 * Tìm trong: title, artist, tags.
 * Không phân biệt hoa thường, hỗ trợ tìm không dấu tiếng Việt.
 *
 * @param {string} keyword
 * @returns {Array<{ video: Video, playlistId: string }>}
 */
function searchVideos(keyword) {
  if (!keyword || keyword.trim() === "") return [];

  const normalizedKeyword = normalizeText(keyword.trim());

  return ALL_VIDEOS_FLAT
    .filter((video) => {
      const matchTitle  = normalizeText(video.title).includes(normalizedKeyword);
      const matchArtist = normalizeText(video.artist).includes(normalizedKeyword);
      const matchTags   = video.tags.some((tag) =>
        normalizeText(tag).includes(normalizedKeyword)
      );
      return matchTitle || matchArtist || matchTags;
    })
    .map((video) => ({
      video,
      playlistId: VIDEO_MAP[video.id].playlistId,
    }));
}

/**
 * Lấy video tiếp theo trong danh sách phẳng.
 * Video cuối → quay về video đầu (vòng lặp).
 *
 * @param {string} currentVideoId
 * @returns {Video}
 */
function getNextVideo(currentVideoId) {
  const currentIndex = ALL_VIDEOS_FLAT.findIndex((v) => v.id === currentVideoId);
  const nextIndex    = (currentIndex + 1) % ALL_VIDEOS_FLAT.length;
  return ALL_VIDEOS_FLAT[nextIndex];
}

/**
 * Lấy video trước đó trong danh sách phẳng.
 * Video đầu → nhảy về video cuối (vòng lặp).
 *
 * @param {string} currentVideoId
 * @returns {Video}
 */
function getPreviousVideo(currentVideoId) {
  const currentIndex = ALL_VIDEOS_FLAT.findIndex((v) => v.id === currentVideoId);
  const prevIndex    = (currentIndex - 1 + ALL_VIDEOS_FLAT.length) % ALL_VIDEOS_FLAT.length;
  return ALL_VIDEOS_FLAT[prevIndex];
}

/**
 * Lấy video đầu tiên trong toàn bộ danh sách.
 * Dùng cho nút "về đầu danh sách".
 *
 * @returns {Video}
 */
function getFirstVideo() {
  return ALL_VIDEOS_FLAT[0];
}


// ─────────────────────────────────────────────
// 5. INTERNAL UTILITIES (private, không export)
// ─────────────────────────────────────────────

/**
 * Chuẩn hóa chuỗi: lowercase + bỏ dấu tiếng Việt.
 * Giúp tìm "tru tinh" ra được "Trữ Tình".
 *
 * @param {string} str
 * @returns {string}
 */
function normalizeText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")                 // tách ký tự + dấu thành 2 code point riêng
    .replace(/[\u0300-\u036f]/g, "")  // xóa phần dấu
    .replace(/đ/g, "d")               // xử lý riêng chữ đ (không nằm trong NFD)
    .replace(/Đ/g, "D");
}


// ─────────────────────────────────────────────
// 6. PUBLIC API
// ─────────────────────────────────────────────

export {
  PLAYLISTS,
  ALL_VIDEOS_FLAT,
  getPlaylistById,
  getVideoById,
  searchVideos,
  getNextVideo,
  getPreviousVideo,
  getFirstVideo,
};
