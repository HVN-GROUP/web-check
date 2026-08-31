/**
 * Bảng màu HVN Group cho webcheck.onl.
 *
 * File này là của upstream, và là file DUY NHẤT phải sửa để đổi theme cả app:
 * cả 39 card đều import `colors` từ đây. Giữ nguyên tên khoá của upstream để
 * không phải sửa component nào — chỉ đổi giá trị. Khi sync upstream, nếu file
 * này xung đột thì giữ bản của HVN và chỉ thêm khoá mới mà upstream thêm.
 *
 * Nguồn giá trị: `client/hvn/tokens.css` (trích từ design system HVN).
 *
 * LƯU Ý VỀ TÊN KHOÁ: upstream đặt tên theo theme TỐI (`backgroundLighter` =
 * sáng hơn nền đen). Bản thiết kế HVN là theme SÁNG, nên ý nghĩa đảo lại:
 * "lighter" giờ là bề mặt thẻ trắng nổi trên nền xám, "darker" là xám đậm hơn
 * để phân tách. Tên giữ nguyên, ý nghĩa đọc theo hướng "tương phản hơn".
 */
const colors = {
  primary: '#ea4445', // --hvn-red: CTA, nhấn thương hiệu
  primaryLighter: '#c93939', // --hvn-red-dark: trạng thái hover. Trên nền sáng,
  // "nhấn hơn" nghĩa là ĐẬM hơn, không phải nhạt hơn.
  textColor: '#333333', // --hvn-ink
  textColorSecondary: '#808080', // --hvn-gray
  background: '#f5f5f5', // --hvn-surface: nền trang
  backgroundDarker: '#ececec', // --hvn-gray-200: nền lõm / phân tách
  backgroundLighter: '#ffffff', // --hvn-white: bề mặt thẻ
  bgShadowColor: 'rgba(35, 31, 32, 0.1)', // đổ bóng mềm thay cho bóng khối đen
  fgShadowColor: 'rgba(234, 68, 69, 0.28)', // --shadow-red: quầng sáng CTA
  primaryTransparent: 'rgba(234, 68, 69, 0.08)',

  // Action Colors — bộ functional của design system
  info: '#17a2b8', // --hvn-info
  success: '#28a745', // --hvn-success
  warning: '#ffc107', // --hvn-warning
  error: '#c93939', // --hvn-red-dark: mức "vấn đề"
  danger: '#a82822', // --hvn-danger-deep: mức "nghiêm trọng", tách khỏi đỏ CTA
  neutral: '#dcdcdc', // --hvn-gray-300: viền
};

export default colors;
