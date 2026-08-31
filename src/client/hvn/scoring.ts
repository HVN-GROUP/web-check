/**
 * Chấm điểm bản quét: điểm tổng 0–100, điểm từng nhóm, và mức rủi ro.
 *
 * Nguyên liệu đã có sẵn trong upstream: `runAnalysis()` trong
 * `client/analysis/registry.ts` chạy 24 rule và trả về `Finding[]`, mỗi finding
 * có `severity`. File này chỉ tổng hợp — không tự phân tích lại dữ liệu thô.
 *
 * HIỆU CHUẨN TRỌNG SỐ: bản thiết kế đưa một ví dụ cụ thể — 1 nghiêm trọng,
 * 6 vấn đề, 11 cảnh báo → điểm tổng 72. Bộ trọng số dưới đây tái tạo đúng ví dụ
 * đó: 100 − (1×10) − (6×2) − (11×0,5) = 72,5 → 72. Nếu đổi trọng số, hãy kiểm
 * lại với ví dụ này trước, kẻo điểm hiển thị lệch hẳn so với bản thiết kế đã
 * được duyệt.
 */

import type { Finding, Severity } from 'client/analysis/types';
import { HVN_GROUPS, groupOfCard, type HvnGroupId } from './groups';

/** Điểm trừ cho mỗi mức độ. `info` và `pass` không trừ điểm. */
const PENALTY: Record<Severity, number> = {
  critical: 10,
  issue: 2,
  warning: 0.5,
  info: 0,
  pass: 0,
};

export type RiskBand = 'thap' | 'trung-binh' | 'cao' | 'nghiem-trong';

export interface RiskLevel {
  band: RiskBand;
  /** Nhãn hiển thị, ví dụ "Rủi ro trung bình" */
  label: string;
  /** Token màu trong `hvn/tokens.css` */
  colorVar: string;
}

/** Đếm số finding theo từng mức độ. Dùng cho khối thống kê ở thẻ điểm tổng. */
export type SeverityCounts = Record<Severity, number>;

export interface GroupScore {
  id: HvnGroupId;
  name: string;
  score: number;
  /** Chuỗi phần trăm dùng trực tiếp cho width của thanh tiến độ */
  pct: string;
  colorVar: string;
  counts: SeverityCounts;
}

export interface ScanScore {
  total: number;
  risk: RiskLevel;
  counts: SeverityCounts;
  groups: GroupScore[];
}

const emptyCounts = (): SeverityCounts => ({
  critical: 0,
  issue: 0,
  warning: 0,
  info: 0,
  pass: 0,
});

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Điểm từ một tập finding: 100 trừ dần theo mức độ, chặn trong [0, 100]. */
const scoreFrom = (counts: SeverityCounts): number => {
  const penalty = (Object.keys(PENALTY) as Severity[]).reduce(
    (sum, sev) => sum + counts[sev] * PENALTY[sev],
    0,
  );
  return Math.round(clamp(100 - penalty));
};

/**
 * Mức rủi ro theo điểm. Ngưỡng chọn sao cho ví dụ 72 điểm của bản thiết kế rơi
 * vào "Rủi ro trung bình" — đúng như thiết kế thể hiện.
 */
export const riskOf = (score: number): RiskLevel => {
  if (score >= 85) return { band: 'thap', label: 'Rủi ro thấp', colorVar: 'var(--hvn-success)' };
  if (score >= 65)
    return { band: 'trung-binh', label: 'Rủi ro trung bình', colorVar: 'var(--hvn-warning)' };
  if (score >= 40) return { band: 'cao', label: 'Rủi ro cao', colorVar: 'var(--hvn-red)' };
  return { band: 'nghiem-trong', label: 'Rủi ro nghiêm trọng', colorVar: 'var(--hvn-danger-deep)' };
};

/** Màu của thanh điểm nhóm — cùng ngưỡng với mức rủi ro, bớt một bậc nhãn. */
const groupColor = (score: number): string => {
  if (score >= 85) return 'var(--hvn-success)';
  if (score >= 65) return 'var(--hvn-warning)';
  return 'var(--hvn-red)';
};

const countBySeverity = (findings: Finding[]): SeverityCounts =>
  findings.reduce((acc, f) => {
    acc[f.severity] += 1;
    return acc;
  }, emptyCounts());

/**
 * Tổng hợp `Finding[]` thành điểm tổng + điểm 5 nhóm.
 *
 * Lưu ý: một nhóm chưa có finding nào (vì các job của nó còn đang chạy hoặc bị
 * skip) sẽ được 100 điểm. Đó là chủ ý — thà hiện 100 rồi tụt dần khi dữ liệu về,
 * còn hơn hiện 0 làm người dùng tưởng website có vấn đề nghiêm trọng.
 */
export const computeScore = (findings: Finding[]): ScanScore => {
  const counts = countBySeverity(findings);
  const total = scoreFrom(counts);

  const groups: GroupScore[] = HVN_GROUPS.map((g) => {
    const groupCounts = countBySeverity(findings.filter((f) => groupOfCard(f.cardId)?.id === g.id));
    const score = scoreFrom(groupCounts);
    return {
      id: g.id,
      name: g.name,
      score,
      pct: `${score}%`,
      colorVar: groupColor(score),
      counts: groupCounts,
    };
  });

  return { total, risk: riskOf(total), counts, groups };
};

/**
 * Câu tóm tắt một dòng dưới điểm tổng, dựng theo số liệu thật thay vì câu cố
 * định — bản thiết kế viết sẵn "một lỗi nghiêm trọng và sáu vấn đề cấu hình",
 * và câu đó sẽ sai với mọi website khác.
 */
export const summarize = (score: ScanScore): string => {
  const { critical, issue, warning } = score.counts;
  if (!critical && !issue && !warning) {
    return 'Không phát hiện vấn đề nào trong các hạng mục đã quét được.';
  }
  const parts: string[] = [];
  if (critical) parts.push(`${critical} lỗi nghiêm trọng cần xử lý ngay`);
  if (issue) parts.push(`${issue} vấn đề cấu hình nên khắc phục sớm`);
  if (warning) parts.push(`${warning} cảnh báo nên rà soát`);
  const head = critical ? 'Website đang có' : 'Website hoạt động ổn định, nhưng có';
  return `${head} ${parts.join(', ')}.`;
};
