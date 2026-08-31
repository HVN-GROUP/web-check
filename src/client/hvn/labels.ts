/**
 * Tiêu đề tiếng Việt cho 39 hạng mục, và các chuỗi UI dùng chung.
 *
 * Upstream đặt tiêu đề bằng tiếng Anh trong `client/jobs/registry.ts`. Sửa
 * thẳng file đó sẽ xung đột mỗi lần sync, nên bảng dịch nằm ở đây và được tra
 * theo card id — upstream thêm card mới thì card đó tự dùng tiêu đề gốc, không
 * bị mất.
 *
 * QUY TẮC DÙNG TỪ: giữ nguyên thuật ngữ mà dân kỹ thuật Việt Nam vẫn đọc bằng
 * tiếng Anh (DNSSEC, HSTS, Cookies, Security.txt, TLS, HTTP header). Dịch phần
 * còn lại. Đây cũng là cách bản thiết kế chọn — 20 tiêu đề nó đưa ra được giữ
 * NGUYÊN VĂN ở dưới và có chú thích, đừng sửa lại theo ý khác.
 */

/** Tiêu đề lấy nguyên văn từ mảng `ALL` trong bản thiết kế. */
const FROM_DESIGN: Record<string, string> = {
  ssl: 'Chứng thư SSL',
  'http-security': 'HTTP Security',
  ports: 'Cổng đang mở',
  'tls-security-audit': 'TLS Security Audit',
  dns: 'Bản ghi DNS',
  dnssec: 'DNSSEC',
  'mail-config': 'Cấu hình email',
  'tech-stack': 'Tech Stack',
  'block-lists': 'Danh tiếng tên miền',
  status: 'Hiệu năng máy chủ',
  carbon: 'Dung lượng trang',
  subdomains: 'Tên miền phụ',
  'social-tags': 'Social Tags',
  rank: 'Xếp hạng toàn cầu',
  'linked-pages': 'Liên kết nội bộ',
  'security-txt': 'Security.txt',
  firewall: 'Tường lửa',
  redirects: 'Chuyển hướng',
  cookies: 'Cookies',
  'robots-txt': 'Robots & Sitemap',
};

/** 19 hạng mục bản thiết kế không nêu tên — dịch theo cùng văn phong. */
const ADDITIONAL: Record<string, string> = {
  location: 'Vị trí máy chủ',
  domain: 'Whois tên miền',
  whois: 'Thông tin tên miền',
  quality: 'Chất lượng trang',
  hosts: 'Máy chủ liên quan',
  'server-info': 'Thông tin máy chủ',
  vulnerabilities: 'Lỗ hổng đã biết',
  headers: 'HTTP header',
  'tls-connection': 'Kết nối TLS',
  'tls-client-compat': 'Tương thích TLS',
  'trace-route': 'Đường đi dữ liệu',
  'dns-server': 'Máy chủ DNS',
  hsts: 'HSTS',
  threats: 'Mã độc & lừa đảo',
  archives: 'Lịch sử lưu trữ',
  screenshot: 'Ảnh chụp trang',
  'social-presence': 'Hiện diện mạng xã hội',
  sitemap: 'Trang trong sitemap',
  'txt-records': 'Bản ghi TXT',
};

const LABELS: Record<string, string> = { ...FROM_DESIGN, ...ADDITIONAL };

/**
 * Tiêu đề tiếng Việt của một hạng mục, rơi về tiêu đề gốc của upstream nếu
 * chưa dịch. Không bao giờ trả về chuỗi rỗng.
 */
export const hvnLabel = (cardId: string, fallback: string): string => LABELS[cardId] || fallback;

/** Các hạng mục chưa có bản dịch — chạy sau mỗi lần sync upstream để biết cần bù. */
export const untranslatedCards = (cardIds: string[]): string[] =>
  cardIds.filter((id) => !LABELS[id]);

/** Chuỗi UI dùng chung, gom một chỗ để không rải chữ cứng khắp component. */
export const UI = {
  scanning: 'Đang phân tích dữ liệu…',
  rescan: 'Quét lại',
  exportPdf: 'Xuất báo cáo PDF',
  scoreTotal: 'Điểm tổng',
  advisoryTitle: 'Cảnh báo cần xử lý',
  advisorySub: 'Mỗi cảnh báo kèm dịch vụ HVN có thể khắc phục',
  advisoryEmpty: 'Chưa phát hiện vấn đề nào cần xử lý trong các hạng mục đã quét được.',
  handledByHvn: 'HVN xử lý',
  consult: 'Tư vấn',
  filterAll: 'Tất cả',
  searchPlaceholder: 'Tìm trong kết quả…',
  itemsSuffix: 'hạng mục',
  noFilterMatch: 'Không có hạng mục nào khớp bộ lọc.',
} as const;
