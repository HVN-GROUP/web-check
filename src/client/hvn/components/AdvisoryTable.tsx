/**
 * Bảng "Cảnh báo cần xử lý" — mỗi cảnh báo kèm dịch vụ HVN có thể khắc phục.
 *
 * Số đo theo bản thiết kế: hàng grid 120px / 1fr / 260px, gap 24px, padding
 * 20px 28px, viền dưới #F5F5F5; nút "Tư vấn" viền #FBD3D3 nền #FDECEC, hover
 * đảo sang nền đỏ chữ trắng.
 *
 * Nguồn dữ liệu là `runAnalysis()` của upstream (24 rule, `Finding[]`) — không
 * tự phân tích lại. Phần HVN thêm vào chỉ là: dịch nhãn mức độ sang tiếng
 * Việt, và tra dịch vụ tương ứng qua `hvn/services.ts`.
 */

import styled from '@emotion/styled';
import type { Finding, Severity } from 'client/analysis/types';
import { serviceForCard } from '../services';
import { findingTitle, findingDetail } from '../findings';
import { UI } from '../labels';

const Wrap = styled.section`
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--page-pad);
  width: 100%;
  box-sizing: border-box;
`;

const Card = styled.div`
  background: var(--hvn-white);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`;

const Head = styled.div`
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--hvn-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 22px;
    color: var(--hvn-gray-900);
  }
`;

const Sub = styled.div`
  margin-top: 5px;
  font-size: 13.5px;
  color: var(--hvn-gray);
`;

const Count = styled.div`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--hvn-gray);
  white-space: nowrap;
`;

const Row = styled.div`
  padding: 20px 28px;
  border-bottom: 1px solid var(--hvn-gray-100);
  display: grid;
  grid-template-columns: 116px 1fr 300px;
  gap: 24px;
  align-items: center;

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const Pill = styled.div<{ tone: string; tint: string }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 11px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: var(--w-semibold);
  background: ${(p) => p.tint};
  color: ${(p) => p.tone};
  white-space: nowrap;
`;

const Dot = styled.span<{ tone: string }>`
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: var(--r-pill);
  background: ${(p) => p.tone};
`;

const Title = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 15.5px;
  font-weight: var(--w-semibold);
  color: var(--hvn-gray-900);
  cursor: pointer;

  &:hover {
    color: var(--hvn-red);
  }
`;

const Detail = styled.div`
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--hvn-gray);
  overflow-wrap: anywhere;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;

  @media (max-width: 860px) {
    justify-content: flex-start;
  }
`;

const ServiceBox = styled.div`
  text-align: right;

  @media (max-width: 860px) {
    text-align: left;
  }
`;

const ServiceLabel = styled.div`
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--hvn-gray-400);
  white-space: nowrap;
`;

const ServiceName = styled.div`
  margin-top: 2px;
  font-size: 13.5px;
  font-weight: var(--w-semibold);
  color: var(--hvn-ink);
  line-height: 1.35;
`;

const CtaLink = styled.a`
  padding: 9px 14px;
  border: 1px solid var(--hvn-red-tint-border);
  background: var(--hvn-red-tint);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: var(--w-semibold);
  color: var(--hvn-red-dark);
  white-space: nowrap;
  text-decoration: none;
  transition:
    background var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--hvn-red);
    color: var(--hvn-white);
  }
`;

const Empty = styled.div`
  padding: 28px;
  font-size: 14.5px;
  color: var(--hvn-gray-600);
`;

/** Nhãn và màu cho từng mức độ, theo mảng `advisories` của bản thiết kế. */
const LEVELS: Partial<Record<Severity, { label: string; tone: string; tint: string }>> = {
  critical: {
    label: 'Nghiêm trọng',
    tone: 'var(--hvn-red)',
    tint: 'var(--hvn-red-tint)',
  },
  issue: {
    label: 'Vấn đề',
    tone: 'var(--hvn-red-dark)',
    tint: 'var(--hvn-red-tint)',
  },
  warning: {
    label: 'Cảnh báo',
    tone: 'var(--hvn-warning-fg)',
    tint: 'var(--hvn-warning-tint)',
  },
};

/** Chỉ hiện ba mức đáng hành động, nặng trước. `info` và `pass` không vào bảng. */
const ORDER: Severity[] = ['critical', 'issue', 'warning'];

const AdvisoryTable = (props: {
  findings: Finding[];
  onJumpTo: (cardId: string) => void;
}): JSX.Element | null => {
  const rows = props.findings
    .filter((f) => ORDER.includes(f.severity))
    .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

  // Chưa quét xong hoặc website không có vấn đề nào -> vẫn hiện thẻ, nhưng nói rõ.
  return (
    <Wrap>
      <Card>
        <Head>
          <div>
            <h3>{UI.advisoryTitle}</h3>
            <Sub>{UI.advisorySub}</Sub>
          </div>
          <Count>
            {rows.length} {UI.itemsSuffix}
          </Count>
        </Head>

        {rows.length === 0 && <Empty>{UI.advisoryEmpty}</Empty>}

        {rows.map((f, i) => {
          const level = LEVELS[f.severity];
          const service = serviceForCard(f.cardId);
          if (!level) return null;
          return (
            <Row key={`${f.cardId}-${f.title}-${i}`}>
              <Pill tone={level.tone} tint={level.tint}>
                <Dot tone={level.tone} />
                {level.label}
              </Pill>
              <div>
                <Title
                  type="button"
                  onClick={() => props.onJumpTo(f.cardId)}
                  title="Xem chi tiết hạng mục"
                >
                  {findingTitle(f.title)}
                </Title>
                {f.detail && <Detail>{findingDetail(f.detail)}</Detail>}
              </div>
              <Right>
                {service && (
                  <>
                    <ServiceBox>
                      <ServiceLabel>{UI.handledByHvn}</ServiceLabel>
                      <ServiceName>{service.name}</ServiceName>
                    </ServiceBox>
                    <CtaLink href={service.path} target="_blank" rel="noreferrer">
                      {UI.consult}
                    </CtaLink>
                  </>
                )}
              </Right>
            </Row>
          );
        })}
      </Card>
    </Wrap>
  );
};

export default AdvisoryTable;
