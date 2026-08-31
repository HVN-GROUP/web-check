/**
 * Ánh xạ 39 card của web-check vào 5 nhóm chủ đề của bản thiết kế HVN.
 *
 * Vì sao cần file này: upstream gắn thẻ card bằng 4 nhãn kỹ thuật
 * (`server` / `client` / `security` / `meta`) — hợp với người làm kỹ thuật,
 * nhưng không phải cách khách hàng doanh nghiệp đọc kết quả. Bản thiết kế gom
 * theo 5 nhóm theo ngôn ngữ người dùng, và đây là chỗ dịch giữa hai cách gom.
 *
 * NGUỒN CHUẨN của danh sách card là `allCardIds` trong `client/jobs/registry.ts`.
 * Khi upstream thêm check mới, `auditGroupCoverage()` ở cuối file sẽ phát hiện
 * card chưa được gán nhóm. Chạy nó sau mỗi lần sync upstream.
 */

import { allCardIds } from 'client/jobs/registry';

export type HvnGroupId = 'bao-mat' | 'dns' | 'ha-tang' | 'hieu-nang' | 'seo';

export interface HvnGroup {
  id: HvnGroupId;
  /** Nhãn hiển thị, đúng như bản thiết kế */
  name: string;
  cardIds: string[];
}

/**
 * Thứ tự nhóm theo bản thiết kế (trang chủ: "gom theo 5 nhóm").
 *
 * Lệch so với bản thiết kế, đã đối chiếu với code thật ở v2.2.4:
 * - Thiết kế ghi "Site Features" trong nhóm Hiệu năng, nhưng upstream đã XOÁ
 *   `api/features.js` ở v2.2.x — không còn card này.
 * - Thiết kế không có 3 card mới của v2.2.x: `vulnerabilities`,
 *   `tls-client-compat`, `block-lists`. Cả ba đều thuộc Bảo mật.
 * - Vì vậy Bảo mật có 11 card (thiết kế vẽ 8), Hiệu năng có 5 (thiết kế vẽ 6).
 */
export const HVN_GROUPS: HvnGroup[] = [
  {
    id: 'bao-mat',
    name: 'Bảo mật',
    cardIds: [
      'ssl',
      'tls-connection',
      'tls-security-audit',
      'tls-client-compat',
      'http-security',
      'hsts',
      'security-txt',
      'cookies',
      'threats',
      'block-lists',
      'vulnerabilities',
    ],
  },
  {
    id: 'dns',
    name: 'DNS & Tên miền',
    cardIds: [
      'dns',
      'dns-server',
      'dnssec',
      'txt-records',
      'domain',
      'whois',
      'mail-config',
      'subdomains',
    ],
  },
  {
    id: 'ha-tang',
    name: 'Hạ tầng',
    cardIds: [
      'ports',
      'trace-route',
      'firewall',
      'location',
      'server-info',
      'status',
      'redirects',
      'hosts',
    ],
  },
  {
    id: 'hieu-nang',
    name: 'Hiệu năng',
    cardIds: ['quality', 'carbon', 'headers', 'screenshot', 'archives'],
  },
  {
    id: 'seo',
    name: 'SEO & Nội dung',
    cardIds: [
      'social-tags',
      'social-presence',
      'rank',
      'linked-pages',
      'sitemap',
      'robots-txt',
      'tech-stack',
    ],
  },
];

/** Tra nhóm của một card. Trả về undefined nếu card chưa được gán nhóm. */
const cardToGroup = new Map<string, HvnGroup>(
  HVN_GROUPS.flatMap((g) => g.cardIds.map((id) => [id, g] as [string, HvnGroup])),
);

export const groupOfCard = (cardId: string): HvnGroup | undefined => cardToGroup.get(cardId);

/** Tổng số hạng mục thật. Dùng con số này thay vì hardcode — thiết kế ghi "35",
 *  code cũ ghi "36 endpoint", con số đúng ở v2.2.4 là 39 và nó SẼ đổi. */
export const TOTAL_CARDS = allCardIds.length;

/**
 * Card có trong registry nhưng chưa được gán nhóm, và ngược lại.
 *
 * Gọi hàm này trong dev để phát hiện lệch sau mỗi lần sync upstream. Không
 * throw: một card thiếu nhóm chỉ nên rơi vào "chưa phân loại", không được làm
 * sập trang kết quả.
 */
export const auditGroupCoverage = (): { missing: string[]; unknown: string[] } => {
  const assigned = new Set(cardToGroup.keys());
  const real = new Set(allCardIds);
  return {
    missing: allCardIds.filter((id) => !assigned.has(id)),
    unknown: [...assigned].filter((id) => !real.has(id)),
  };
};
