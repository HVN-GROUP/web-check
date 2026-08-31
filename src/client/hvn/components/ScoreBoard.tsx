/**
 * Thẻ "Điểm tổng" + 4 thẻ điểm nhóm ở đầu trang kết quả.
 *
 * Số đo lấy trực tiếp từ bản thiết kế `HVN WebCheck.dc.html` (khối
 * `data-screen-label="Trang kết quả"`), không phải ước lượng: panel tối
 * #1A1A1A bo 18px padding 30px, cỡ điểm 66px, lưới nền 26px, cột 300px + 1fr
 * cách nhau 24px.
 */

import styled from '@emotion/styled';
import type { Finding } from 'client/analysis/types';
import { computeScore, summarize } from '../scoring';

const Wrap = styled.section`
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--page-pad);
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TotalPanel = styled.div`
  background: var(--hvn-gray-900);
  border-radius: 18px;
  padding: 30px;
  color: var(--hvn-white);
  position: relative;
  overflow: hidden;

  /* Lưới mờ chìm trong nền panel — thiết kế dùng 26px, độ mờ .045 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
    background-size: 26px 26px;
  }
`;

const PanelBody = styled.div`
  position: relative;
`;

const Overline = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--hvn-gray-400);
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 10px;
`;

const ScoreValue = styled.div<{ tone: string }>`
  font-size: 66px;
  font-weight: var(--w-bold);
  line-height: 1;
  letter-spacing: -0.03em;
  color: ${(p) => p.tone};
  font-variant-numeric: tabular-nums;
`;

const ScoreMax = styled.div`
  font-size: 18px;
  color: var(--hvn-gray);
  padding-bottom: 8px;
`;

const RiskBadge = styled.div<{ tone: string }>`
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: var(--w-semibold);
  color: ${(p) => p.tone};
  background: color-mix(in srgb, ${(p) => p.tone} 16%, transparent);
  border: 1px solid color-mix(in srgb, ${(p) => p.tone} 40%, transparent);
`;

const Dot = styled.span<{ tone: string }>`
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: var(--r-pill);
  background: ${(p) => p.tone};
`;

const Summary = styled.p`
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.65;
  color: var(--hvn-gray-400);
`;

const Counts = styled.div`
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13.5px;
`;

const CountRow = styled.div<{ tone: string }>`
  display: flex;
  justify-content: space-between;

  span:first-of-type {
    color: var(--hvn-gray-400);
  }
  span:last-of-type {
    font-family: var(--font-mono);
    font-weight: var(--w-bold);
    color: ${(p) => p.tone};
    font-variant-numeric: tabular-nums;
  }
`;

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const GroupCard = styled.div`
  background: var(--hvn-white);
  border-radius: var(--r-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
`;

const GroupHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const GroupName = styled.div`
  font-size: 15.5px;
  font-weight: var(--w-semibold);
  color: var(--hvn-gray-900);
`;

const GroupScoreValue = styled.div<{ tone: string }>`
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: var(--w-bold);
  color: ${(p) => p.tone};
  font-variant-numeric: tabular-nums;
`;

const Track = styled.div`
  margin-top: 14px;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--hvn-gray-200);
  overflow: hidden;
`;

const Fill = styled.div<{ pct: string; tone: string }>`
  height: 100%;
  border-radius: var(--r-pill);
  width: ${(p) => p.pct};
  background: ${(p) => p.tone};
  transition: width var(--dur) var(--ease-out);
`;

const Note = styled.div`
  margin-top: 12px;
  font-size: 13.5px;
  color: var(--hvn-gray);
  min-height: 1.2em;
`;

/**
 * Ghi chú dưới mỗi thanh điểm nhóm, dựng từ số liệu thật.
 *
 * Bản thiết kế viết sẵn ghi chú cố định ("4 header bảo mật bị thiếu, chưa bật
 * HSTS") — câu đó chỉ đúng với website mẫu, nên ở đây sinh động theo số đếm.
 */
const groupNote = (counts: Record<string, number>): string => {
  const parts: string[] = [];
  if (counts.critical) parts.push(`${counts.critical} nghiêm trọng`);
  if (counts.issue) parts.push(`${counts.issue} vấn đề`);
  if (counts.warning) parts.push(`${counts.warning} cảnh báo`);
  if (!parts.length) return counts.pass ? `${counts.pass} hạng mục đạt` : 'Chưa có dữ liệu';
  return parts.join(' · ');
};

const ScoreBoard = (props: { findings: Finding[] }): JSX.Element => {
  const score = computeScore(props.findings);
  const { counts } = score;

  return (
    <Wrap>
      <TotalPanel>
        <PanelBody>
          <Overline>Điểm tổng</Overline>
          <ScoreRow>
            <ScoreValue tone={score.risk.colorVar}>{score.total}</ScoreValue>
            <ScoreMax>/100</ScoreMax>
          </ScoreRow>
          <RiskBadge tone={score.risk.colorVar}>
            <Dot tone={score.risk.colorVar} />
            {score.risk.label}
          </RiskBadge>
          <Summary>{summarize(score)}</Summary>
          <Counts>
            <CountRow tone="var(--hvn-red)">
              <span>Nghiêm trọng</span>
              <span>{counts.critical}</span>
            </CountRow>
            <CountRow tone="var(--hvn-warning)">
              <span>Vấn đề</span>
              <span>{counts.issue}</span>
            </CountRow>
            <CountRow tone="var(--hvn-white)">
              <span>Cảnh báo</span>
              <span>{counts.warning}</span>
            </CountRow>
            <CountRow tone="var(--hvn-success)">
              <span>Đạt</span>
              <span>{counts.pass}</span>
            </CountRow>
          </Counts>
        </PanelBody>
      </TotalPanel>

      <GroupGrid>
        {score.groups.map((g) => (
          <GroupCard key={g.id}>
            <GroupHead>
              <GroupName>{g.name}</GroupName>
              <GroupScoreValue tone={g.colorVar}>{g.score}</GroupScoreValue>
            </GroupHead>
            <Track>
              <Fill pct={g.pct} tone={g.colorVar} />
            </Track>
            <Note>{groupNote(g.counts)}</Note>
          </GroupCard>
        ))}
      </GroupGrid>
    </Wrap>
  );
};

export default ScoreBoard;
