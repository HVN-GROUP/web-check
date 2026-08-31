/**
 * Nạp mô tả hạng mục từ Payload CMS vào `src/client/hvn/cms-docs.json`.
 *
 * Chạy TRƯỚC `yarn build`. Không đặt vào `prebuild` của npm để build không bao
 * giờ phụ thuộc mạng: pipeline deploy gọi `yarn hvn:docs` rồi mới `yarn build`,
 * còn máy dev thì bỏ qua cũng không sao — file JSON rỗng nghĩa là dùng nguyên
 * `docs.ts` gốc.
 *
 * KHÔNG BAO GIỜ thoát với mã lỗi. CMS chết không phải lý do để build đỏ: app
 * quét chạy tốt mà không cần nội dung này.
 */
import { writeFile } from 'node:fs/promises';

const OUT = new URL('../src/client/hvn/cms-docs.json', import.meta.url);
const base = (process.env.PUBLIC_HVN_SITE_URL || 'https://webcheck.onl').replace(/\/$/, '');
const url = `${base}/api/hang-muc`;

const write = async (items, why) => {
  await writeFile(OUT, `${JSON.stringify({ items }, null, 2)}\n`);
  console.log(`[hvn:docs] ${items.length} hạng mục — ${why}`);
};

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    await write([], `CMS trả HTTP ${res.status}, dùng nguyên docs.ts`);
    process.exit(0);
  }
  const body = await res.json();
  const items = Array.isArray(body?.items) ? body.items : [];
  // Chỉ giữ bản ghi đủ dữ liệu để ghi đè, tránh làm mất mô tả gốc bằng chuỗi rỗng.
  const clean = items.filter((i) => i?.maCard && i?.moTaNgan && i?.tieuDe && i?.slug);
  await write(clean, `nạp từ ${url}`);
} catch (e) {
  await write([], `không gọi được ${url} (${e.message}), dùng nguyên docs.ts`);
}
