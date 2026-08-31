/**
 * Mức độ nặng nhất của một thẻ → màu chấm ở đầu thẻ.
 *
 * Bản thiết kế gán mỗi thẻ một chấm màu (`dot`) thể hiện tình trạng: đỏ khi có
 * lỗi, vàng khi cần chú ý, xanh khi đạt. Ở đây suy ra từ `Finding[]` của
 * `runAnalysis()` thay vì gán tay từng thẻ như bản mock.
 */

import type { Finding, Severity } from 'client/analysis/types';

/** Nặng dần từ trái sang phải — dùng để chọn mức nặng nhất. */
const RANK: Severity[] = ['pass', 'info', 'warning', 'issue', 'critical'];

const TONE: Record<Severity, string> = {
  critical: 'var(--hvn-red)',
  issue: 'var(--hvn-red-dark)',
  warning: 'var(--hvn-warning)',
  info: 'var(--hvn-info)',
  pass: 'var(--hvn-success)',
};

/** Chấm cho thẻ chưa có finding nào — trung tính, không phải "đạt". */
const NEUTRAL = 'var(--hvn-gray-300)';

/**
 * Gom findings theo card một lần, trả về hàm tra màu. Gọi kiểu này để tránh
 * quét lại toàn bộ mảng findings cho từng thẻ trong 39 lần render.
 */
export const buildToneLookup = (findings: Finding[]): ((cardId: string) => string) => {
  const worst = new Map<string, Severity>();
  findings.forEach((f) => {
    const current = worst.get(f.cardId);
    if (!current || RANK.indexOf(f.severity) > RANK.indexOf(current)) {
      worst.set(f.cardId, f.severity);
    }
  });
  return (cardId: string) => {
    const sev = worst.get(cardId);
    return sev ? TONE[sev] : NEUTRAL;
  };
};

/** Bản tra một lần, tiện cho chỗ chỉ cần một thẻ. */
export const worstToneForCard = (findings: Finding[], cardId: string): string =>
  buildToneLookup(findings)(cardId);
