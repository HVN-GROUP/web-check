# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# web-check của HVN — đọc trước khi gõ dòng code đầu tiên

Đây **không phải** dự án của riêng ta. Đây là **fork** của một dự án nguồn mở đang
hoạt động mạnh. Sai lầm tốn kém nhất ở repo này không phải lỗi kỹ thuật, mà là
**sửa sai chỗ, làm mất khả năng nhận cập nhật từ upstream**.

## 1. Đặc tả dự án

| | |
|---|---|
| Repo này | `HVN-GROUP/web-check` (remote `origin`) |
| Nguồn gốc | `lissy93/web-check` (remote `upstream`) — vẫn phát triển tích cực |
| Phiên bản hiện tại | **v2.2.4**, sync bằng fast-forward, **0 commit riêng** |
| Vai trò | Công cụ scan/OSINT, chạy ở **subdomain riêng** |
| Site chính | **Payload CMS** ở repo `../hvn-payload-boilerplate` (Payload 3.88 + Next 16 + Postgres) |
| CMS quản lý | Nội dung marketing & docs. Payload là site chính, web-check chỉ là công cụ |
| Giấy phép | MIT (xem `LICENSE`) — được phép fork và dùng thương mại, giữ nguyên attribution |

```
hvn.xxx          Payload / Next     ← trang chủ, blog, docs, khách hàng, SEO
                 (repo hvn-payload-boilerplate)
                      │  link / reverse-proxy
                      ▼
check.hvn.xxx    web-check          ← repo này, chỉ còn công cụ scan tại /check
```

### Quyết định kiến trúc: KHÔNG nhúng Payload vào repo này

Đã cân nhắc và loại bỏ. Lý do, để sau này không ai đề xuất lại:

- Admin panel của Payload 3 **là** một app Next.js App Router (`@payloadcms/next`).
  Nó không mount được vào Astro/Express. Cơ chế `payload.init({ express: app })`
  chỉ có ở Payload 2, không áp dụng cho bản 3.88 đang dùng.
- Repo này là Astro (`astro.config.mjs`), Payload là Next (`next.config.js`) — hai
  hệ build cạnh tranh trong một repo.
- web-check **hoàn toàn stateless, không có database**. Payload cần Postgres +
  migrations. Thêm DB vào đây là thêm một tầng phải tự bảo trì mãi mãi.
- Nhúng vào = phải sửa `package.json`, `tsconfig.json`, `astro.config.mjs`,
  `server.js` — đúng những file upstream sửa liên tục.

→ **Hai service riêng. Payload là nguồn nội dung, web-check đọc qua HTTP.**

### Một thứ đã có sẵn, đừng viết lại: `BOSS_SERVER`

Vì Payload là site chính, web-check **không cần trang chủ marketing riêng**.
Upstream đã có sẵn: **không set `BOSS_SERVER`** thì `/` tự redirect sang `/check`
(cả `astro.config.mjs` và middleware trong `server.js`).

Nghĩa là **không được xoá hay sửa** `src/pages/index.astro` và
`src/components/homepage/**`. Cứ để nguyên — upstream cập nhật thì vẫn nhận được,
mà người dùng không bao giờ thấy. Build sẽ báo `/index.html (file not created,
response body was empty)`; đó là **đúng**, không phải lỗi.

## 2. Nguyên tắc số 1: giữ đường merge với upstream

> **Đã từng (31/08/2026):** fork tụt lại **154 commits** so với upstream mà không
> ai biết. Trong khoảng đó upstream đã **đổi tên toàn bộ `src/web-check-live/` →
> `src/client/`**. May là fork chưa có commit riêng nào nên sync được bằng
> fast-forward, 0 xung đột. Nếu lúc đó đã kịp làm giao diện mới trên cấu trúc cũ
> thì coi như mất hẳn đường về: git sẽ thấy "upstream xoá 60 file / thêm 60 file"
> trong khi ta cũng sửa đúng những file đó.

**Nguyên tắc: THÊM FILE, đừng SỬA FILE.**

| Vùng | Luật |
|---|---|
| `api/*.js`, `api/_common/**` | **Không bao giờ sửa.** Đường dẫn đã đứng yên qua 154 commits. Check riêng của HVN → file mới, đặt tên `api/hvn-*.js` |
| `src/client/**` | Coi như code vendor. Đổi giao diện qua **token màu** `styles/colors.ts` + CSS override. Thêm job = **append 1 object** vào `jobs/registry.ts`, đừng viết lại entry có sẵn |
| `src/pages/**`, `src/components/**`, `src/layouts/**`, `src/styles/**` | **Phần của ta.** Upstream ít sửa. Đây là chỗ cắm nội dung từ CMS |
| `package.json`, `yarn.lock`, `tsconfig.json` | Tránh. Riêng `yarn.lock` một lần sync đã +12223 dòng |
| `src/client/utils/docs.ts` | 573 dòng, upstream sửa thường xuyên. Nếu lấy mô tả từ CMS thì **merge đè lên**, đừng thay thế — để check mới của upstream vẫn có mô tả mặc định |

### Quy trình sync — làm mỗi 1–2 tháng, đừng để tụt nữa

```bash
git branch pre-upstream-sync-$(date +%Y%m%d)   # LUÔN backup trước
cp .env /tmp/env.backup                        # xem cảnh báo .env bên dưới
git fetch upstream --tags
git merge --ff-only upstream/master            # còn 0 commit riêng thì ff được
```

Khi đã có commit riêng thật, `--ff-only` sẽ fail và thành merge thật. Xung đột chỉ
xảy ra ở đúng những vùng đã sửa theo bảng trên.

> **Đã từng:** `.env` bị **git track** trong fork (dù `.gitignore` có liệt kê — vì
> nó đã bị commit trước khi thêm rule). Upstream đã bỏ track `.env` và chuyển sang
> `.env.sample`, nên **merge xoá luôn file `.env`**. Phải backup trước mỗi lần sync.
> Hiện tại `.env` đã ở trạng thái untracked đúng chuẩn.

## 3. Phương hướng triển khai

| # | Việc | Làm ở đâu | Rủi ro merge | Trạng thái |
|---|---|---|---|---|
| 0 | Backup + sync lên v2.2.4 | repo này | — | ✅ Xong 31/08/2026, branch `pre-upstream-sync-20260831` |
| 1 | Xác minh: typecheck / lint / format / build | repo này | — | ✅ 0 lỗi, build xanh |
| A | Collections cho blog / docs / landing | `hvn-payload-boilerplate` | **Không** (repo khác) | ⬜ Chưa |
| B | Reverse proxy + domain, không set `BOSS_SERVER` | hạ tầng + `.env` | **Không** | ⬜ Chưa |
| C | Đổi theme app scan (màu, logo, font, bỏ link sponsor) | `src/client/styles/colors.ts`, `src/layouts/` | Thấp, nếu chỉ đổi token | ⬜ Chưa |
| D | 40 mô tả hạng mục lấy từ CMS | merge đè `docs.ts` | Thấp (thêm file mới + 3 dòng import) | 📋 Đã có kế hoạch: [`docs/ke-hoach-noi-dung-cms.md`](docs/ke-hoach-noi-dung-cms.md) |

Chưa push gì lên `origin`. Việc push là quyết định của người dùng, phải hỏi.

**Nguyên tắc khi làm bước C:** đổi **token**, không viết lại component. Toàn bộ
màu tập trung ở `src/client/styles/colors.ts`. Sửa một file đó cho ra diff 20 dòng
thay vì 2000 dòng, và merge được.

## 4. Lệnh

```bash
npx --yes yarn@1.22.22 <cmd>   # xem cảnh báo yarn bên dưới
yarn                 # cài dependencies (~4 phút, 816MB — puppeteer tải Chromium)
yarn dev             # API :3001 (nodemon) + Astro dev, chạy song song
yarn dev:api         # chỉ API, DISABLE_GUI=true PORT=3001
yarn dev:astro       # chỉ frontend, trỏ vào http://localhost:3001/api
yarn build           # astro check && astro build
yarn start           # production: node server.js (cần build trước)
yarn typecheck       # astro check
yarn lint            # eslint --config .config/eslint.config.js .
yarn format:check    # prettier, không sửa file
yarn hold-my-beer    # format:fix && lint && typecheck — chạy trước khi commit
```

Yêu cầu **Node >= 22.12** (Astro 7). **Không có test suite**; `yarn hold-my-beer`
là toàn bộ cửa kiểm tra.

> **Đã từng:** Node 26 bản Homebrew **không còn `corepack`** (Node 25+ đã bỏ khỏi
> bản phân phối), mà `package.json` pin `packageManager: yarn@1.22.22`. Cách vào
> việc: `npx --yes yarn@1.22.22 <cmd>`. Đừng mất thời gian với `corepack enable`.

Sau khi sync, dùng `format:check` chứ **đừng** `format:fix` — repo vừa fast-forward
nên đã đúng format, chạy `fix` chỉ làm bẩn diff.

Vài check cần `chromium` và `traceroute` có trong môi trường; thiếu thì check tự
trả về `skipped`, không crash.

## 5. Kiến trúc

### `api/` — mỗi check một file, độc lập nền tảng

```js
const fooHandler = async (url, event, context) => { /* trả object, hoặc throw */ };
export const handler = middleware(fooHandler);
export default handler;
```

Handler bên trong **chỉ thấy một `url` đã normalize** và trả dữ liệu.
`api/_common/middleware.js` lo phần thích ứng nền tảng, phát hiện từ env lúc
import (`PLATFORM` > `VERCEL` > `WC_SERVER`, mặc định `NETLIFY`): Vercel/Node nhận
`(req, res)`, Netlify nhận `(event, context, callback)`.
**Không bao giờ xử lý req/res hay phân nhánh nền tảng bên trong một check.**

Tên file **chính là** tên route **và** job id mà frontend dùng.

Helper dùng chung trong `api/_common/`:

| File | Vai trò |
|---|---|
| `http.js` | `httpGet` — HTTP client (upstream đã bỏ axios/got, thay bằng file này) |
| `upstream.js` | `upstreamError(err, ctx)` map lỗi mạng/HTTP về envelope chuẩn; `requireEnv` trả `skipped` khi thiếu API key |
| `check-skipper.js` | `shouldSkip(path, target)` — thực thi `VITE_DISABLE_EVERYTHING`, `API_DISABLED_CHECKS`, `API_ENABLED_CHECKS`, `API_BLOCKED_HOSTS`, và chặn `publicOnlyChecks` với target private/localhost/CIDR (**chống SSRF**) |
| `parse-target.js`, `social.js`, `logger.js` | parse target, tra social, log |

Response có 3 dạng envelope mà frontend hiểu: dữ liệu, `{ error }`, hoặc
`{ skipped }`. Muốn nói "không áp dụng cho host này" thì **trả `{ skipped: lý do }`**,
đừng throw.

### `server.js` — Express cho bản self-host (`PLATFORM=node`)

Đăng ký mọi `api/*.js` thành `GET /api/<tên-file>`, cộng thêm endpoint gộp
`GET /api?url=...` chạy song song tất cả handler (có tôn trọng `shouldSkip`).
Set `WC_SERVER=true` để middleware chọn chế độ non-lambda. Phục vụ frontend đã
build (static `dist/client/` + SSR `dist/server/entry.mjs`), có `GET /healthz`,
và đọc `TRUST_PROXY` khi chạy sau reverse proxy.

### `src/` — hai frontend riêng biệt

- **Vỏ Astro**: `src/pages/*.astro`, `src/components/**` (Astro + Svelte 5),
  `src/layouts/**`, `src/styles/*.scss`. Alias `@components/*`, `@layouts/*`,
  `@styles/*`.
- **App scan**: `src/client/**` — SPA React 19, `react-router` v8, emotion
  styled-components. Được mount bởi `src/pages/check/[...target].astro`
  (`prerender = false`) render `main.tsx` với `client:load`. Route trong `App.tsx`,
  tất cả nằm dưới `/check`.

Import trong SPA dùng tiền tố `client/...`, giải quyết qua `baseUrl: "src"` — **không
phải** alias trong `paths`. (Trước v2.2.0 tiền tố này là `web-check-live/...`.)

### Job registry — điểm mở rộng

Upstream đã refactor `Results.tsx` từ 948 dòng xuống **249 dòng**, chuyển sang
registry khai báo:

- `src/client/jobs/types.ts` — `JobSpec { id, cards[], fetcher, expectedAddressTypes,
  needsIp, noClientTimeout }` và `CardSpec { id, title, tags, Component, pick,
  fallback }`. Một job có thể nuôi nhiều card; `pick` chọn phần dữ liệu cho từng card.
- `src/client/jobs/registry.ts` — mảng ~37 job spec, kèm helper
  `fetchAndProcess(path, fn)` (hỗ trợ template `${url}` / `${ip}`).
- `src/client/hooks/useJobs.ts` — reducer điều phối vòng đời job: fetch, retry,
  abort qua `AbortSignal`, promote fallback, và ngân sách thời gian phía client lấy
  từ `PUBLIC_API_TIMEOUT_LIMIT` (mặc định 45s), job có thể xin miễn bằng
  `noClientTimeout`.
- `src/client/analysis/registry.ts` + `analysis/rules/<card-id>.ts` — analyzer
  thuần, mỗi card một cái, sinh ra bảng findings/điểm. Không bắt buộc cho check mới.

**Thêm một check** = `api/<id>.js` + append 1 `JobSpec` vào `registry.ts` + component
card trong `components/Results/` + entry trong `utils/docs.ts` + (tuỳ chọn) rule
phân tích. Đặt tên file `hvn-*` để merge upstream sạch.

## 6. Đa nền tảng

`astro.config.mjs` chọn adapter theo `PLATFORM` (`node` | `vercel` | `netlify` —
**cloudflare đã bị bỏ ở v2.2.x**), output theo `OUTPUT` (mặc định `static`, vẫn
cho mixed prerender), site URL theo `SITE_URL`. Cùng một thư mục `api/` được dùng
làm Vercel functions (`vercel.json`, maxDuration 45s), Netlify functions
(`netlify.toml`, pin `NODE_VERSION=22`), route Express (`server.js`), hoặc bundle
AWS Lambda (`api/_common/aws-webpack.config.js` — danh sách entry phải sửa tay và
thường lạc hậu so với check mới). `Dockerfile`, `fly.toml`, `render.yaml` đi đường
node.

## 7. Cấu hình

Mọi biến đều không bắt buộc; `.env.sample` là chuẩn. **Lưu ý các tên đã đổi ở
v2.2.x — tên cũ bị bỏ qua im lặng, không báo lỗi:**

| Cũ | Mới |
|---|---|
| `REACT_APP_SHODAN_API_KEY` | `SHODAN_API_KEY` (chuyển sang server-side) |
| `REACT_APP_WHO_API_KEY` | `WHO_API_KEY` (chuyển sang server-side) |
| `API_TIMEOUT_LIMIT` | `PUBLIC_API_TIMEOUT_LIMIT` |
| `BUILT_WITH_API_KEY` | đã bỏ |

Thêm mới ở v2.2.x: `GITHUB_TOKEN`, `API_DISABLED_CHECKS`, `API_ENABLED_CHECKS`,
`API_BLOCKED_HOSTS`, `TRUST_PROXY`, `BOSS_SERVER`.

Key backend mở thêm tính năng hoặc nâng rate-limit cho từng check; thiếu key thì
check trả `{ skipped }` qua `requireEnv`, không sập.

**Khi mở dịch vụ cho bên ngoài:** bật `API_ENABLE_RATE_LIMIT`, đặt
`API_BLOCKED_HOSTS` cho dải nội bộ, và set `TRUST_PROXY` đúng số hop — nếu không
rate-limit sẽ đếm theo IP của proxy chứ không phải IP người dùng.
