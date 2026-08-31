/**
 * Dịch tiêu đề và mô tả cảnh báo sang tiếng Việt.
 *
 * 24 rule trong `client/analysis/rules/` sinh ra 70 tiêu đề và 38 mô tả bằng
 * tiếng Anh. Sửa thẳng các file rule sẽ xung đột mỗi lần sync upstream, nên ở
 * đây dịch trên chuỗi ĐÃ render.
 *
 * Hai tầng:
 *   1. Khớp chính xác — cho chuỗi tĩnh.
 *   2. Regex — cho chuỗi có template (`Missing ${label}`, `Port ${port} open:
 *      ${name}`…), vì sau khi render thì không còn khớp chính xác được nữa.
 *
 * KHÔNG khớp thì trả về NGUYÊN VĂN tiếng Anh. Thà để một dòng tiếng Anh còn hơn
 * dịch nửa vời hoặc mất thông tin — và khi upstream thêm rule mới, dòng tiếng
 * Anh đó chính là dấu hiệu cần bổ sung vào đây.
 */

const TITLE_EXACT: Record<string, string> = {
  'All cookies use Secure/HttpOnly/SameSite': 'Toàn bộ cookie có Secure/HttpOnly/SameSite',
  'Cloudmersive flagged this site as unsafe': 'Cloudmersive đánh dấu website này không an toàn',
  'DKIM key found': 'Đã có khoá DKIM',
  'DMARC policy is monitor-only': 'DMARC chỉ ở chế độ theo dõi',
  'DMARC policy: quarantine': 'DMARC: đưa vào kiểm dịch',
  'DMARC policy: reject': 'DMARC: từ chối',
  'DNSSEC enabled': 'Đã bật DNSSEC',
  'DNSSEC not enabled': 'Chưa bật DNSSEC',
  'Domain expires within a month': 'Tên miền hết hạn trong vòng một tháng',
  'Domain expires within a week': 'Tên miền hết hạn trong vòng một tuần',
  'Domain registration expired': 'Tên miền đã hết hạn đăng ký',
  'Domain registration is valid': 'Đăng ký tên miền còn hiệu lực',
  'HSTS missing includeSubDomains': 'HSTS thiếu includeSubDomains',
  'HSTS missing preload directive': 'HSTS thiếu chỉ thị preload',
  'HSTS preload compatible': 'HSTS đủ điều kiện preload',
  'HTTP requests are redirected to HTTPS': 'Truy cập HTTP được chuyển sang HTTPS',
  'HTTP/2 negotiated via ALPN': 'Đã dùng HTTP/2 qua ALPN',
  'Listed by Google Safe Browsing': 'Bị Google Safe Browsing gắn cờ',
  'Listed on PhishTank': 'Có trong danh sách PhishTank',
  'Listed on URLhaus malware feed': 'Có trong danh sách mã độc URLhaus',
  'No DKIM record discovered on common selectors':
    'Không tìm thấy bản ghi DKIM ở các selector thông dụng',
  'No DMARC record found': 'Không có bản ghi DMARC',
  'No HSTS header': 'Không có header HSTS',
  'No SPF record found': 'Không có bản ghi SPF',
  'No forward secrecy in negotiated cipher': 'Bộ mã đang dùng không có forward secrecy',
  'No security.txt published': 'Chưa công bố security.txt',
  'No threat feed matches': 'Không khớp nguồn dữ liệu mối đe doạ nào',
  'No web application firewall detected': 'Không phát hiện tường lửa ứng dụng (WAF)',
  'Not on any tested DNS blocklist': 'Không nằm trong danh sách chặn DNS nào đã kiểm tra',
  'OCSP stapling not enabled': 'Chưa bật OCSP stapling',
  'Root SPF record is overly permissive': 'Bản ghi SPF gốc quá lỏng',
  'SPF policy permits unauthorised senders': 'SPF cho phép cả người gửi không được uỷ quyền',
  'SPF record published': 'Đã công bố bản ghi SPF',
  'SSL certificate expired': 'Chứng thư SSL đã hết hạn',
  'SSL certificate expiring soon': 'Chứng thư SSL sắp hết hạn',
  'SSL certificate expiring within a week': 'Chứng thư SSL hết hạn trong vòng một tuần',
  'SSL certificate invalid': 'Chứng thư SSL không hợp lệ',
  'SSL certificate renews within a month': 'Chứng thư SSL sẽ gia hạn trong vòng một tháng',
  'SSL certificate valid': 'Chứng thư SSL hợp lệ',
  'Site does not enforce HTTPS': 'Website không bắt buộc dùng HTTPS',
  'Social accounts link back to this site': 'Các tài khoản mạng xã hội có trỏ về website này',
  'Social share metadata complete': 'Thẻ chia sẻ mạng xã hội đầy đủ',
  'TLS 1.2 in use, consider enabling TLS 1.3': 'Đang dùng TLS 1.2, nên bật thêm TLS 1.3',
  'TLS 1.3 negotiated': 'Đã dùng TLS 1.3',
  'robots.txt blocks every crawler from the entire site':
    'robots.txt đang chặn mọi công cụ tìm kiếm khỏi toàn bộ website',
  'security.txt found': 'Đã có security.txt',
  'security.txt not PGP signed': 'security.txt chưa được ký PGP',
};

/**
 * Mô tả cổng rủi ro, lấy đúng bảng `RISKY` trong
 * `client/analysis/rules/ports.ts`. Cần riêng vì nó là phần bị nội suy vào
 * tiêu đề `Port ${port} open: ${known[1]}`.
 */
const PORT_DESC: Record<string, string> = {
  'FTP (cleartext file transfer)': 'FTP (truyền tệp không mã hoá)',
  'Telnet (cleartext shell)': 'Telnet (shell không mã hoá)',
  'SMTP (mail server)': 'SMTP (máy chủ thư)',
  'POP3 (cleartext mail)': 'POP3 (thư không mã hoá)',
  'IMAP (cleartext mail)': 'IMAP (thư không mã hoá)',
  'MySQL exposed to the internet': 'MySQL đang phơi ra Internet',
  'RDP exposed to the internet': 'RDP đang phơi ra Internet',
  'VNC exposed to the internet': 'VNC đang phơi ra Internet',
};

/** Chuỗi có template — khớp sau khi đã render. */
const TITLE_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Missing social tags: (\d+)$/, (m) => `Thiếu ${m[1]} thẻ chia sẻ mạng xã hội`],
  [/^Missing (.+)$/, (m) => `Thiếu ${m[1]}`],
  [/^Port (\d+) open: (.+)$/, (m) => `Cổng ${m[1]} đang mở: ${PORT_DESC[m[2]] || m[2]}`],
  [
    /^Cookie "(.+)" missing (HttpOnly|Secure|SameSite) flag$/,
    (m) => `Cookie "${m[1]}" thiếu cờ ${m[2]}`,
  ],
  [/^Long redirect chain: (\d+) hops$/, (m) => `Chuỗi chuyển hướng dài: ${m[1]} bước`],
  [/^(\d+) redirect hop\(s\)$/, (m) => `${m[1]} bước chuyển hướng`],
  [/^Blocked by (\d+) DNS resolver\(s\)$/, (m) => `Bị ${m[1]} DNS resolver chặn`],
  [
    /^(\d+) simulated client\(s\) cannot connect$/,
    (m) => `${m[1]} trình duyệt mô phỏng không kết nối được`,
  ],
  [/^HSTS max-age below (.+)$/, (m) => `HSTS max-age thấp hơn ${m[1]}`],
  [/^Outdated TLS protocol negotiated: (.+)$/, (m) => `Giao thức TLS lỗi thời: ${m[1]}`],
  [/^Response time over (\d+)ms$/, (m) => `Thời gian phản hồi trên ${m[1]}ms`],
  [/^Slow response time: (\d+)ms$/, (m) => `Phản hồi chậm: ${m[1]}ms`],
  [/^Site responded with (.+)$/, (m) => `Website trả về mã ${m[1]}`],
  [/^SSL Labs grade (.+)$/, (m) => `Xếp hạng SSL Labs: ${m[1]}`],
  [/^Server discloses (.+)$/, (m) => `Máy chủ để lộ ${m[1]}`],
  [
    /^Shodan reports (\d+) CVE\(s\) on this host$/,
    (m) => `Shodan ghi nhận ${m[1]} CVE trên máy chủ này`,
  ],
  [/^Social account not found: (\d+)$/, (m) => `Không tìm thấy ${m[1]} tài khoản mạng xã hội`],
  [
    /^Unconfirmed social accounts: (\d+)$/,
    (m) => `${m[1]} tài khoản mạng xã hội chưa xác nhận được`,
  ],
  [/^WAF detected: (.*)$/, (m) => `Phát hiện WAF: ${m[1]}`],
  [/^(.+) score: (.+)$/, (m) => `Điểm ${m[1]}: ${m[2]}`],
  [/^(.+) set$/, (m) => `Đã đặt ${m[1]}`],
];

const DETAIL_EXACT: Record<string, string> = {
  'Add /.well-known/security.txt with disclosure contact info':
    'Thêm /.well-known/security.txt kèm thông tin liên hệ nhận báo lỗ hổng',
  'Add Strict-Transport-Security to enforce HTTPS for clients':
    'Thêm Strict-Transport-Security để buộc client dùng HTTPS',
  'Add a permanent redirect from http:// to https://':
    'Thêm chuyển hướng vĩnh viễn từ http:// sang https://',
  'Add includeSubDomains to protect every subdomain':
    'Thêm includeSubDomains để bảo vệ mọi tên miền phụ',
  'Add preload to qualify for the HSTS preload list':
    'Thêm preload để đủ điều kiện vào danh sách HSTS preload',
  'Close it or restrict access by firewall if not required':
    'Đóng cổng này, hoặc giới hạn truy cập bằng tường lửa nếu không cần dùng',
  'Collapse intermediate redirects to reduce latency':
    'Gộp các bước chuyển hướng trung gian để giảm độ trễ',
  'Confirm this is intentional, otherwise search engines will not index the site':
    'Xác nhận đây là chủ ý, nếu không thì công cụ tìm kiếm sẽ không lập chỉ mục website',
  'Consider Cloudflare, AWS WAF or similar to filter malicious traffic':
    'Nên dùng Cloudflare, AWS WAF hoặc tương đương để lọc lưu lượng độc hại',
  'Disable TLS 1.0 and 1.1 on the server': 'Tắt TLS 1.0 và 1.1 trên máy chủ',
  'Enable OCSP stapling to speed up cert revocation checks':
    'Bật OCSP stapling để tăng tốc kiểm tra thu hồi chứng thư',
  'Investigate server performance, caching or CDN coverage':
    'Rà soát hiệu năng máy chủ, bộ nhớ đệm hoặc độ phủ CDN',
  'Move from p=none to p=quarantine or p=reject when ready':
    'Chuyển từ p=none sang p=quarantine hoặc p=reject khi đã sẵn sàng',
  'Prefer ECDHE or DHE cipher suites': 'Ưu tiên bộ mã ECDHE hoặc DHE',
  'Publish a DKIM key so receivers can verify message signatures':
    'Công bố khoá DKIM để bên nhận xác minh được chữ ký thư',
  'Publish v=DMARC1 on _dmarc subdomain to prevent spoofing':
    'Công bố v=DMARC1 trên tên miền phụ _dmarc để chặn mạo danh',
  'Publish v=spf1 to authorise legitimate mail senders':
    'Công bố v=spf1 để uỷ quyền cho những nơi gửi thư hợp lệ',
  'Replace +all/?all with ~all or -all to reject spoofed mail':
    'Thay +all/?all bằng ~all hoặc -all để từ chối thư mạo danh',
  'Review cipher suites, protocol versions and key strength':
    'Rà soát bộ mã, phiên bản giao thức và độ dài khoá',
  'Sign DNS records to prevent spoofing and cache poisoning':
    'Ký số bản ghi DNS để chặn mạo danh và đầu độc bộ đệm',
  'Sign the file to let researchers verify authenticity':
    'Ký tệp này để nhà nghiên cứu xác minh được tính xác thực',
  'Site flagged for malware, phishing or unwanted software':
    'Website bị gắn cờ vì mã độc, lừa đảo hoặc phần mềm không mong muốn',
  'Tighten the SPF policy to ~all or -all': 'Thắt chính sách SPF về ~all hoặc -all',
};

const DETAIL_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Set the (.+) response header$/, (m) => `Bổ sung header phản hồi ${m[1]}`],
  [/^Consider adding the (.+) response header$/, (m) => `Nên bổ sung header phản hồi ${m[1]}`],
  [
    /^Expired (\d+) day\(s\) ago, renew before it drops$/,
    (m) => `Đã hết hạn ${m[1]} ngày, gia hạn ngay`,
  ],
  [/^Expired (\d+) day\(s\) ago$/, (m) => `Đã hết hạn ${m[1]} ngày`],
  [/^Expires in (\d+) day\(s\), renew immediately$/, (m) => `Còn ${m[1]} ngày, gia hạn ngay`],
  [
    /^Expires in (\d+) day\(s\), schedule renewal$/,
    (m) => `Còn ${m[1]} ngày, hãy lên lịch gia hạn`,
  ],
  [/^Expires in (\d+) day\(s\)$/, (m) => `Còn ${m[1]} ngày`],
  [
    /^Current max-age is (.+), raise it for preload eligibility$/,
    (m) => `max-age hiện tại là ${m[1]}, cần nâng lên để đủ điều kiện preload`,
  ],
  [/^Listed by (.+)$/, (m) => `Bị gắn cờ bởi ${m[1]}`],
  [/^Add (.+)$/, (m) => `Thêm ${m[1]}`],
  [/^Value: (.+)$/, (m) => `Giá trị: ${m[1]}`],
  [/^This site points to (.+)$/, (m) => `Website này trỏ tới ${m[1]}`],
  [
    /^(.+)\. Patch affected services or block at the firewall$/,
    (m) => `${m[1]}. Hãy vá các dịch vụ bị ảnh hưởng hoặc chặn ở tường lửa`,
  ],
  [
    /^(.+)\. Drop legacy ciphers\/protocols only after weighing reach$/,
    (m) => `${m[1]}. Chỉ bỏ bộ mã/giao thức cũ sau khi cân nhắc phạm vi thiết bị còn dùng`,
  ],
];

const apply = (
  text: string,
  exact: Record<string, string>,
  patterns: [RegExp, (m: RegExpMatchArray) => string][],
): string => {
  const hit = exact[text];
  if (hit) return hit;
  for (const [re, build] of patterns) {
    const m = text.match(re);
    if (m) return build(m);
  }
  return text;
};

/** Tiêu đề cảnh báo bằng tiếng Việt, rơi về nguyên văn nếu chưa dịch. */
export const findingTitle = (text: string): string => apply(text, TITLE_EXACT, TITLE_PATTERNS);

/** Mô tả cảnh báo bằng tiếng Việt, rơi về nguyên văn nếu chưa dịch. */
export const findingDetail = (text?: string): string | undefined =>
  text === undefined ? undefined : apply(text, DETAIL_EXACT, DETAIL_PATTERNS);
