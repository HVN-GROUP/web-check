/**
 * Hợp nhất mô tả hạng mục từ Payload CMS lên trên `client/utils/docs.ts`.
 *
 * NGUYÊN TẮC: GHI ĐÈ, KHÔNG THAY THẾ. `docs.ts` của upstream vẫn là nền. Khi
 * upstream thêm check mới (v2.2.4 vừa thêm 6 cái), check đó có ngay mô tả tiếng
 * Anh mặc định thay vì trống trơn chờ biên tập viên. Có bản tiếng Việt trong
 * CMS thì bản đó ghi đè lên.
 *
 * Dữ liệu CMS được nạp LÚC BUILD qua `scripts/fetch-cms-docs.mjs`, ghi vào
 * `cms-docs.json`. Cố ý không fetch lúc chạy: trang kết quả không được phụ
 * thuộc CMS còn sống. File JSON rỗng nghĩa là không ghi đè gì — build vẫn xanh
 * khi CMS chưa dựng hoặc đang chết.
 *
 * Ba nơi tiêu thụ `docs` (DocContent, About, Home) import từ file này thay vì
 * từ `utils/docs` trực tiếp. Vì vậy mọi named export của `docs.ts` được
 * re-export ở dưới — thiếu một cái là chỗ đó vỡ.
 */

import docs, { type Doc } from 'client/utils/docs';
import cms from './cms-docs.json';

export { about, featureIntro, license, fairUse, supportUs } from 'client/utils/docs';
export type { Doc } from 'client/utils/docs';

interface CmsItem {
  maCard: string;
  tieuDe: string;
  moTaNgan: string;
  slug: string;
}

const CMS_SITE = (import.meta.env.PUBLIC_HVN_SITE_URL || 'https://webcheck.onl').replace(/\/$/, '');

/** Ghi đè tiêu đề + mô tả, và thêm liên kết tới trang đầy đủ trên CMS. */
export const mergeDocs = (base: Doc[], items: CmsItem[]): Doc[] => {
  if (!items.length) return base;
  const byId = new Map(items.map((i) => [i.maCard, i]));
  return base.map((doc) => {
    const hit = byId.get(doc.id);
    if (!hit) return doc;
    const readMore = {
      title: `Tìm hiểu thêm: ${hit.tieuDe}`,
      link: `${CMS_SITE}/hang-muc/${hit.slug}`,
    };
    // `resources` của Doc là union hai kiểu; chỉ chèn liên kết khi nó đã ở dạng
    // đối tượng, để không trộn hai kiểu trong cùng một mảng.
    const resources =
      Array.isArray(doc.resources) && typeof doc.resources[0] === 'object'
        ? [readMore, ...(doc.resources as { title: string; link: string }[])]
        : doc.resources;
    return {
      ...doc,
      title: hit.tieuDe || doc.title,
      description: hit.moTaNgan || doc.description,
      resources,
    };
  });
};

const items = (cms as { items?: CmsItem[] }).items || [];

/** Số hạng mục đã có bản tiếng Việt từ CMS — tiện kiểm tra lúc deploy. */
export const cmsOverrideCount = items.filter((i) => docs.some((d) => d.id === i.maCard)).length;

export default mergeDocs(docs, items);
