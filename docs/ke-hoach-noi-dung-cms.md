# Kế hoạch: đưa 40 mô tả hạng mục kiểm tra vào Payload CMS

Trạng thái: **kế hoạch, chưa viết code.** Xem mục "Phương hướng triển khai" trong
`CLAUDE.md` để biết việc này nằm ở đâu trong lộ trình (bước D).

## 1. Vì sao đáng làm

`src/client/utils/docs.ts` (754 dòng) đang chứa, cho **40 chủ đề**: mô tả kỹ thuật,
tình huống sử dụng, và danh sách tài liệu tham khảo. SSL, DNSSEC, HSTS, DMARC,
TLS cipher suites, security.txt, DNS records...

Toàn bộ khối này hiện:

- nằm trong **một file JS**, biên tập viên không sửa được;
- chỉ hiện trong **modal** của app scan;
- ở trên trang `/check/*` mà ta **vừa chủ động chặn index** (đúng, vì trang kết quả
  là không gian URL vô hạn) — nên Google không bao giờ đọc được nội dung này;
- viết bằng **tiếng Anh**.

Trên `webcheck.onl` — domain đúng chủ đề — 40 chủ đề này là 40 trang nội dung kỹ
thuật nhắm đúng truy vấn thông tin ("HSTS là gì", "cách kiểm tra DNSSEC"). Khung
Payload đã có sẵn `lib/seo.ts` (canonical + OG theo từng trang) và
`faqPageJsonLd()` — tức là phần hạ tầng SEO **không phải làm gì thêm**.

## 2. Mô hình dữ liệu — chỗ dễ làm sai nhất

> **Cảnh báo:** `docs.ts` khoá theo **card id**, **KHÔNG** phải theo endpoint trong
> `api/`. Mô hình theo endpoint là sai và sẽ lệch dữ liệu.

Số liệu thực tế (đo tại v2.2.4):

| | Số lượng |
|---|---|
| Endpoint trong `api/` | 36 |
| Card thực render (`allCardIds` trong `src/client/jobs/registry.ts`) | **39** |
| Mô tả trong `docs.ts` | 40 |
| Card thiếu mô tả | 0 |
| Mô tả mồ côi | 1 (`get-ip` — job này có `cards: []`, chỉ cấp IP cho job khác) |

Vì sao lệch: một job có thể sinh nhiều card, và một số endpoint không sinh card nào.

```
job 'whois'   ──> card 'domain'  + card 'whois'
job 'shodan'  ──> card 'hosts'   + card 'server-info' + card 'vulnerabilities'
job 'get-ip'  ──> (khong co card, chi cap IP cho cac job khac)
```

**Nguồn chuẩn của danh sách card là `allCardIds` trong
`src/client/jobs/registry.ts`**, không phải `ls api/`. Nếu lấy theo `api/` sẽ hụt 3
card của shodan, hụt 2 card TLS, và thừa `shodan` + `tls-labs` (là nguồn dữ liệu,
không phải card).

## 3. Collection trong Payload

Một collection mới, đặt cạnh `Services`/`News` trong repo `hvn-payload-boilerplate`:

`collections/HangMucKiemTra.ts`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `maCard` | text, unique, **required** | Phải khớp đúng card id. Đây là khoá ghép với app |
| `tieuDe` | text | Ví dụ "Chứng chỉ SSL" |
| `slug` | text, unique | Dùng `lib/slugify.ts` có sẵn |
| `moTa` | richText (lexical) | Ứng với `description` |
| `congDung` | richText | Ứng với `use` |
| `moTaNgan` | textarea, max ~200 | Bản rút gọn cho modal trong app |
| `nhomChuDe` | select | `server` / `client` / `security` / `meta` — khớp `tags` của card |
| `taiLieu` | array {`tieuDe`, `lienKet`} | Ứng với `resources` |
| `anhMinhHoa` | upload → `Media` | **Xem mục 5 về ảnh** |
| `cauHoiThuongGap` | array {`cauHoi`, `traLoi`} | Nạp vào `faqPageJsonLd()` |
| `thuTu` | number | Thứ tự hiển thị |
| `hienTrenWeb` | checkbox, mặc định bật | Tách "có trang web" khỏi "có trong app" |

Route đề xuất: `app/(app)/hang-muc/[slug]/page.tsx`, dùng `lib/seo.ts` +
`breadcrumbJsonLd` + `faqPageJsonLd` theo đúng khuôn các route đã có.

> **Không đặt slug trùng `/check`.** Reverse proxy sẽ định tuyến `/check/*` sang
> web-check; một trang Payload nằm ở đó sẽ không bao giờ được phục vụ.

## 4. Luồng dữ liệu — nguyên tắc **merge đè, không thay thế**

```
Payload ──REST──> fetch luc build ──> hop nhat ──> app scan
                                        ^
                                        │
                     docs.ts van la NEN: check moi cua upstream
                     tu co mo ta mac dinh, khong mat khi sync
```

Cách làm giữ được đường merge:

1. **Không sửa `docs.ts`.** Thêm file mới `src/client/utils/docs-hvn.ts`, export
   `mergeDocs(remote): Doc[]` — lấy `docs.ts` làm nền, ghi đè theo `maCard`.
2. Ba consumer đổi import: `components/misc/DocContent.tsx`, `views/About.tsx`,
   `views/Home.tsx`. Là 3 dòng sửa trong `src/client/**` — chấp nhận được, và ghi
   vào `CLAUDE.md` để lần sync sau biết mà xử lý.
3. **Fetch lúc build, không lúc chạy.** App scan không được phụ thuộc CMS còn sống.
4. Payload lỗi/timeout → dùng nguyên `docs.ts`. Fail phải im lặng và an toàn.

Lợi ích của hướng này: upstream thêm check mới (như 6 check vừa thêm ở v2.2.4) thì
check đó **tự có mô tả tiếng Anh mặc định** ngay, không phải chờ biên tập viên; khi
nào có bản tiếng Việt thì nó tự được ghi đè.

## 5. Ảnh minh hoạ — phải tự host

> **Phát hiện:** 37/40 mô tả đang trỏ ảnh tới **`pixelflare.cc`** — image host của
> tác giả gốc. Nghĩa là site của HVN đang hotlink ảnh từ hạ tầng người khác: ảnh có
> thể đổi hoặc mất bất cứ lúc nào, và ta đang dùng băng thông của họ.

Khi làm bước này: chụp lại ảnh từ chính instance của HVN (sau khi đã đổi giao diện
theo brand), upload vào `Media` của Payload. Ảnh trong `docs.ts` sẽ tự bị ghi đè
qua cơ chế merge ở mục 4.

## 6. Khối lượng thật

Phần tốn công là **nội dung, không phải code**:

- 40 chủ đề × (dịch mô tả + dịch công dụng + kiểm lại link tài liệu + viết FAQ).
- Nội dung gốc là tiếng Anh chuyên ngành; dịch máy sẽ ra văn phong sai và thuật ngữ
  lệch. Cần người biết kỹ thuật đọc lại.

**Đề xuất làm theo lô, không làm một lượt.** Lô đầu 8 chủ đề có lượng tìm kiếm cao
nhất và dễ bán dịch vụ kèm:

`ssl` · `dns` · `headers` · `http-security` · `hsts` · `dnssec` · `mail-config` · `ports`

Xong lô đầu thì đo bằng Search Console trước khi làm tiếp 32 chủ đề còn lại.

## 7. Thứ tự thực hiện

| # | Việc | Ở đâu |
|---|---|---|
| 1 | Tạo collection `HangMucKiemTra` + migration | `hvn-payload-boilerplate` |
| 2 | Route `hang-muc/[slug]` + SEO + FAQ schema | `hvn-payload-boilerplate` |
| 3 | Seed 40 bản ghi từ `docs.ts` (giữ nguyên tiếng Anh làm nền) | script trong repo Payload |
| 4 | Dịch + biên tập lô 8 chủ đề đầu | nội dung |
| 5 | `docs-hvn.ts` + đổi 3 dòng import trong web-check | repo này |
| 6 | Chụp và tự host lại ảnh minh hoạ | cả hai |

Bước 1–4 làm trong repo Payload nên **rủi ro merge bằng không**. Chỉ bước 5 chạm
vào repo này, và chỉ chạm ở mức thêm file mới + 3 dòng import.

## 8. Rủi ro cần canh

- **Nội dung mỏng.** 40 trang mỗi trang 150 từ thì chính là cái bẫy thin content mà
  ta vừa đi chặn ở `/check/*`. Mỗi trang cần đủ dày và có FAQ, hoặc thà đăng ít
  trang mà tốt.
- **Trùng nội dung với app.** Bản trong modal phải là bản **rút gọn** (`moTaNgan`),
  đừng đăng cùng một khối chữ ở hai nơi.
- **Đừng để lô 8 chủ đề đầu chờ 32 chủ đề còn lại.** Xuất bản dần, sitemap của khung
  tự cập nhật.
