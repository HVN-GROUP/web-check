/**
 * Ánh xạ hạng mục lỗi → dịch vụ HVN có thể khắc phục.
 *
 * Đây là dữ liệu KINH DOANH, không phải dữ liệu kỹ thuật — nó không tồn tại
 * trong upstream và sẽ không bao giờ tồn tại. Bảng cảnh báo ở trang kết quả
 * ("Mỗi cảnh báo kèm dịch vụ HVN có thể khắc phục") đọc từ đây.
 *
 * Danh sách dịch vụ và cách gán lấy đúng theo mảng `advisories` trong bản
 * thiết kế: Port 3306 mở → "Hosting & máy chủ"; thiếu CSP → "Rà soát & xử lý
 * sự cố"; chưa bật HSTS → "Chứng thư số SSL"; không có DNSSEC → "Dịch vụ tên
 * miền"; chưa có sao lưu → "Backup & Acronis".
 */

export interface HvnService {
  id: string;
  /** Nhãn hiển thị ở cột "HVN xử lý" */
  name: string;
  /** Đường dẫn trang dịch vụ trên site chính. Đặt qua biến môi trường để
   *  không phải sửa code khi đổi cấu trúc URL bên Payload. */
  path: string;
}

const base = (import.meta.env.PUBLIC_HVN_SITE_URL || 'https://hvn.vn').replace(/\/$/, '');

const svc = (id: string, name: string, slug: string): HvnService => ({
  id,
  name,
  path: `${base}/dich-vu/${slug}`,
});

export const SERVICES = {
  ssl: svc('ssl', 'Chứng thư số SSL', 'chung-thu-so-ssl'),
  backup: svc('backup', 'Backup & Acronis', 'backup-acronis'),
  hosting: svc('hosting', 'Hosting & máy chủ', 'hosting-may-chu'),
  incident: svc('incident', 'Rà soát & xử lý sự cố', 'ra-soat-xu-ly-su-co'),
  domain: svc('domain', 'Dịch vụ tên miền', 'ten-mien'),
  email: svc('email', 'Email doanh nghiệp', 'email-doanh-nghiep'),
} satisfies Record<string, HvnService>;

/**
 * Card nào thì do dịch vụ nào xử lý.
 *
 * Chỉ gán cho card mà HVN thật sự có dịch vụ tương ứng. Card không có trong
 * bảng này sẽ hiện cảnh báo mà KHÔNG kèm gợi ý dịch vụ — cố gán một dịch vụ
 * không liên quan chỉ làm mất tin cậy phần còn lại của báo cáo.
 */
const CARD_TO_SERVICE: Record<string, HvnService> = {
  // Chứng thư số & mã hoá
  ssl: SERVICES.ssl,
  hsts: SERVICES.ssl,
  'tls-connection': SERVICES.ssl,
  'tls-security-audit': SERVICES.ssl,
  'tls-client-compat': SERVICES.ssl,

  // Cấu hình ứng dụng / rà soát
  'http-security': SERVICES.incident,
  headers: SERVICES.incident,
  cookies: SERVICES.incident,
  'security-txt': SERVICES.incident,
  threats: SERVICES.incident,
  'block-lists': SERVICES.incident,
  vulnerabilities: SERVICES.incident,
  redirects: SERVICES.incident,

  // Hạ tầng
  ports: SERVICES.hosting,
  firewall: SERVICES.hosting,
  status: SERVICES.hosting,
  location: SERVICES.hosting,
  'server-info': SERVICES.hosting,
  quality: SERVICES.hosting,

  // Tên miền & DNS
  dnssec: SERVICES.domain,
  dns: SERVICES.domain,
  'dns-server': SERVICES.domain,
  domain: SERVICES.domain,
  whois: SERVICES.domain,
  subdomains: SERVICES.domain,

  // Email
  'mail-config': SERVICES.email,
  'txt-records': SERVICES.email,
};

export const serviceForCard = (cardId: string): HvnService | undefined => CARD_TO_SERVICE[cardId];
