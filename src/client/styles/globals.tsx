import { Global, css } from '@emotion/react';

/**
 * Style toàn cục của app quét.
 *
 * ĐÃ SỬA CHO THEME SÁNG HVN. Bản upstream đặt cho cả `body, div, a, p, span,
 * ul, li, small, h1..h4, button, section`:
 *
 *     font-family: var(--font-mono);
 *     color: #fff;
 *
 * Hai dòng đó là lý do trước khi sửa: (1) toàn bộ chữ ra phông monospace, sai
 * hẳn so với bản thiết kế dùng sans cho tiêu đề và prose; (2) chữ TRẮNG trên
 * nền trắng — nhãn nút "Quét lại" biến mất hoàn toàn.
 *
 * Biến phông được khai lại ở đây thay vì trong `hvn/tokens.css`, vì
 * `src/styles/typography.scss` (phía Astro) cũng khai `--font-sans`/`--font-mono`
 * và thứ tự bundle CSS không chắc chắn. Emotion `<Global>` chèn style lúc chạy
 * nên luôn thắng cascade — hết chuyện tranh biến.
 */
const GlobalStyles = () => (
  <Global
    styles={css`
      :root {
        /* Google Sans là phông thương hiệu, nhưng không cấp phép mở nên không
           nhúng. Rơi về phông hệ thống, hình dáng gần nhất. */
        --font-sans:
          'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace;
      }

      body,
      div,
      a,
      p,
      span,
      ul,
      li,
      small,
      h1,
      h2,
      h3,
      h4,
      button,
      section {
        font-family: var(--font-sans);
        color: var(--hvn-ink);
      }

      /* Dữ liệu dạng khoá–giá trị trong thẻ vẫn dùng mono, đúng như bản thiết
         kế (các hàng trong thẻ kết quả đều là chữ mono). */
      span.lbl,
      span.val,
      code,
      pre {
        font-family: var(--font-mono);
      }

      #fancy-background p span {
        color: transparent;
      }
    `}
  />
);

export default GlobalStyles;
