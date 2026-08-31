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
| Phiên bản hiện tại | Dựa trên upstream **v2.2.4** |
| **Branch làm việc** | **`hvn`** — mọi việc của HVN nằm ở đây. `master` là bản gương upstream, ĐỪNG commit lên đó |
| Vai trò | Công cụ scan/OSINT tại **webcheck.onl** (domain riêng) |
| Site chính | **Payload CMS** ở repo `../hvn-payload-boilerplate` (Payload 3.88 + Next 16 + Postgres) |
| CMS quản lý | Nội dung marketing & docs. Payload là site chính, web-check là công cụ tại `/check` |
| Giấy phép | MIT (xem `LICENSE`) — được phép fork và dùng thương mại, giữ nguyên attribution |

```
webcheck.onl/            Payload / Next  ← trang chủ, blog, /hang-muc/* (SEO)
webcheck.onl/hang-muc/*  (repo hvn-payload-boilerplate, branch feat/webcheck-onl)
         │  reverse-proxy theo đường dẫn
         ▼
webcheck.onl/check/*     web-check       ← repo này, công cụ quét. noindex.
```

Một domain, nên link equity dồn về một chỗ. Giá trị SEO nằm ở các trang nội dung
do Payload phục vụ; `/check/*` bị chặn index có chủ đích.

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

### Mô hình hai branch

```
master   bản gương upstream, KHÔNG có commit nào của HVN
   │     -> luôn `merge --ff-only` được, sync không bao giờ xung đột
   ▼
hvn      việc của HVN. Chủ động merge master vào khi muốn cập nhật.
```

Lý do tách: nếu HVN commit thẳng lên `master` thì mỗi lần sync là một merge thật
trên nhánh chính, và xung đột xảy ra ở nơi không kiểm soát được. Tách ra thì
`master` luôn sạch, còn xung đột (nếu có) chỉ xuất hiện đúng lúc ta cố ý merge.

**Đừng commit lên `master`.** Nó phải giữ nguyên đúng nội dung upstream.

### Quy trình sync — làm mỗi 1–2 tháng, đừng để tụt nữa

```bash
git branch pre-upstream-sync-$(date +%Y%m%d)   # LUÔN backup trước
cp .env /tmp/env.backup                        # xem cảnh báo .env bên dưới

git fetch upstream --tags
git checkout master
git merge --ff-only upstream/master            # luôn thành công vì master sạch
git push origin master

git checkout hvn
git merge master                               # xung đột (nếu có) xảy ra Ở ĐÂY
npx --yes yarn@1.22.22 install                 # yarn.lock thường đổi nhiều
npx --yes yarn@1.22.22 hold-my-beer            # format + lint + typecheck
```

Xung đột chỉ xảy ra ở đúng những vùng đã sửa theo bảng trên. Với `yarn.lock`,
lấy bản của upstream rồi cài lại: `git checkout --theirs yarn.lock`.

> **Đã từng:** `.env` bị **git track** trong fork (dù `.gitignore` có liệt kê — vì
> nó đã bị commit trước khi thêm rule). Upstream đã bỏ track `.env` và chuyển sang
> `.env.sample`, nên **merge xoá luôn file `.env`**. Phải backup trước mỗi lần sync.
> Hiện tại `.env` đã ở trạng thái untracked đúng chuẩn.

## 3. Phương hướng triển khai

| # | Việc | Làm ở đâu | Rủi ro merge | Trạng thái |
|---|---|---|---|---|
| 0 | Backup + sync lên v2.2.4 | repo này | — | ✅ Xong 31/08/2026, branch `pre-upstream-sync-20260831` |
| 1 | Xác minh: typecheck / lint / format / build | repo này | — | ✅ 0 lỗi, build xanh |
| A | Collection + route hạng mục kiểm tra | `hvn-payload-boilerplate`, branch `feat/webcheck-onl` | **Không** (repo khác) | ✅ Xong, **chưa chạy migration** |
| B | Reverse proxy + domain, không set `BOSS_SERVER` | hạ tầng + `.env` | **Không** | ⬜ Chưa |
| C | Giao diện HVN cho trang kết quả + Việt hoá | `src/client/hvn/**` + 5 file upstream | Thấp | ✅ Xong, đã xác minh bằng trình duyệt |
| D | 40 mô tả hạng mục lấy từ CMS | `hvn/docs-hvn.ts` + 3 dòng import | Thấp | ✅ Đường ống xong, **chờ nội dung**. Kế hoạch: [`docs/ke-hoach-noi-dung-cms.md`](docs/ke-hoach-noi-dung-cms.md) |

`master` đã push lên `origin`. Phần Payload nằm ở branch `feat/webcheck-onl` của
repo `hvn-payload-boilerplate`, **chưa merge vào `main`** — xem lý do ở mục 8.

**Việc còn lại:** B (hạ tầng), nội dung cho D, và 3 màn còn lại của bản thiết kế
(Trang chủ, Blog, Bài viết) — cả ba thuộc Payload, xem mục 8.

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

> **Đã từng:** `yarn build` rồi thấy trang trắng, hydrate lỗi 404 trên
> `_astro/main.*.js`. Nguyên nhân: `server.js` `import()` động
> `dist/server/entry.mjs` và Node cache module ESM đó, nên **server đang chạy vẫn
> phục vụ SSR cũ sau khi build**. Phải khởi động lại `node server.js`. Lần đó
> `pkill -f "node server.js"` không diệt được tiến trình cũ, nó giữ cổng và
> server mới chết im vì `EADDRINUSE` — kiểm tra bằng
> `lsof -nP -iTCP:3000 -sTCP:LISTEN` rồi `kill -9` theo PID.

> **Đã từng (máy dev macOS):** hai check `screenshot` và `tech-stack` trả 500.
> Bản Chrome trong `~/.cache/puppeteer` thiếu framework (`dlopen` lỗi). Đặt
> `CHROME_PATH` trỏ Chrome hệ thống là `screenshot` chạy lại;
> `tech-stack` vẫn lỗi vì `wappalyzer` v6 không tương thích Chrome 148
> (`Session closed`) — vấn đề của thư viện upstream, không phải của ta.

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

### Lớp giao diện HVN — `src/client/hvn/`

Toàn bộ phần riêng của HVN nằm trong thư mục này, thêm file chứ không sửa file:

| File | Vai trò |
|---|---|
| `tokens.css` | Token design system HVN |
| `groups.ts` | 39 card → 5 nhóm chủ đề, kèm `auditGroupCoverage()` |
| `scoring.ts` | `Finding[]` → điểm tổng + điểm nhóm. Dùng `Math.floor`, **đừng** đổi sang `round` (xem chú thích trong file) |
| `severity.ts` | Mức nặng nhất của thẻ → màu chấm |
| `labels.ts` | 39 tiêu đề tiếng Việt + chuỗi UI |
| `findings.ts` | Dịch 70 tiêu đề + 38 mô tả cảnh báo của 24 rule |
| `services.ts` | Hạng mục lỗi → dịch vụ HVN khắc phục |
| `cardMeta.tsx` | Context đưa nhóm + chấm xuống vỏ `Card` mà không sửa 39 component |
| `docs-hvn.ts` | Hợp nhất mô tả từ CMS lên `docs.ts`, ghi đè chứ không thay thế |
| `components/` | `ResultsTopBar`, `ScoreBoard`, `AdvisoryTable`, `ResultsFilters` |

**File upstream đã sửa** (5 chỗ, đều nhỏ và có lý do ghi trong file):
`styles/colors.ts` (đổi giá trị, giữ tên khoá → cả 39 card đổi theme),
`styles/index.css`, `styles/globals.tsx` (bỏ `color:#fff` và font mono toàn cục),
`components/Form/Card.tsx` (vỏ thẻ), `views/Results.tsx` (lắp lớp HVN).
Cộng 3 dòng import trong `DocContent.tsx`, `About.tsx`, `Home.tsx`.

Nạp nội dung từ CMS: `yarn hvn:docs` (gọi `/api/hang-muc` của Payload, ghi
`hvn/cms-docs.json`). Chạy TRƯỚC `yarn build`. Không bao giờ thoát mã lỗi —
CMS chết thì dùng nguyên `docs.ts`.

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

## 8. Ranh giới với repo Payload — đọc trước khi sửa gì bên đó

`../hvn-payload-boilerplate` **là khung dùng lại cho nhiều website** của HVN, không
phải site của webcheck.onl. Bằng chứng: trang chủ là *global* `HomePage` dùng
chung, và `AGENTS.md` của nó mở đầu bằng quy trình "phỏng vấn trước khi dựng một
website mới từ khung này".

Vì vậy: **đừng nhồi schema riêng của WebCheck vào `main` của khung.** Làm thế là
đẩy `HangMucKiemTra` và các section riêng của webcheck.onl sang mọi site khách
khác dựng từ khung.

Phần Payload của WebCheck hiện nằm ở **branch `feat/webcheck-onl`**, gồm:

| File | Vai trò |
|---|---|
| `collections/HangMucKiemTra.ts` | 1 bản ghi = 1 hạng mục trong app + 1 trang `/hang-muc/{slug}` |
| `lib/getHangMuc.ts` | 3 getter, lọc `_status=published`, bắt lỗi DB |
| `app/(app)/hang-muc/[slug]/page.tsx` | Trang SEO, có breadcrumb + FAQPage schema |
| `app/(app)/api/hang-muc/route.ts` | Nguồn cho `yarn hvn:docs` của web-check |

**Chưa chạy migration.** Collection mới cần bảng trong Postgres; việc đó tác động
vào database thật nên người vận hành tự chạy:

```bash
yarn migrate:create   # sinh file migration
yarn migrate          # áp dụng, qua scripts/migrate-an-toan.mjs
```

**Quyết định còn treo:** repo nào sẽ là site thật của webcheck.onl? Hai hướng —
tách repo mới từ khung (đúng doctrine của khung), hoặc giữ branch này rồi merge
vào một repo site riêng. Chọn xong mới nên làm 3 màn còn lại của bản thiết kế
(Trang chủ, Blog, Bài viết), vì cả ba đều là *nội dung + route* bên Payload chứ
không phải code bên này.
