/**
 * Thanh trên cùng của trang kết quả: tên miền, thông tin lượt quét, quét lại,
 * xuất báo cáo.
 *
 * Số đo theo bản thiết kế: nền trắng viền dưới #ECECEC, padding 14px 40px,
 * chip tên miền nền #F5F5F5 bo 8px, nút "Quét lại" viền #DCDCDC, nút đỏ
 * "Xuất báo cáo PDF" có quầng sáng.
 *
 * VỀ NÚT XUẤT BÁO CÁO: web-check không có chức năng sinh PDF, và bản thiết kế
 * thì hứa có. Ở đây dùng hộp thoại in của trình duyệt (in ra PDF) — thật và
 * chạy được ngay. Nếu sau này cần PDF dựng phía máy chủ có logo và bố cục
 * riêng, đó là việc riêng, đừng để nút này thành nút giả.
 */

import styled from '@emotion/styled';

const Bar = styled.div`
  background: var(--hvn-white);
  border-bottom: 1px solid var(--hvn-gray-200);
`;

const Inner = styled.div`
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 14px var(--page-pad);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const DomainChip = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--hvn-gray-100);
  border-radius: var(--r-sm);
  text-decoration: none;

  span {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: var(--w-semibold);
    color: var(--hvn-gray-900);
  }

  &:hover span {
    color: var(--hvn-red);
  }
`;

const Meta = styled.div`
  font-size: 13.5px;
  color: var(--hvn-gray);
`;

const Actions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GhostButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  border: 1px solid var(--hvn-gray-300);
  background: none;
  border-radius: var(--r-sm);
  font-family: inherit;
  font-size: 14px;
  font-weight: var(--w-medium);
  color: var(--hvn-gray-600);
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);

  &:hover {
    border-color: var(--hvn-gray-400);
    color: var(--hvn-gray-900);
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  background: var(--hvn-red);
  color: var(--hvn-white);
  border: none;
  border-radius: var(--r-sm);
  font-family: inherit;
  font-size: 14px;
  font-weight: var(--w-semibold);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(234, 68, 69, 0.22);
  transition: background var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--hvn-red-dark);
  }
`;

const LockIcon = (props: { tone: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.tone}
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
    style={{ flex: 'none' }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RescanIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

/** "19,4s" — dấu phẩy thập phân theo quy ước tiếng Việt, như bản thiết kế. */
const formatSeconds = (ms: number): string => `${(ms / 1000).toFixed(1).replace('.', ',')}s`;

const formatScanTime = (at: Date): string =>
  `${at.toLocaleDateString('vi-VN')} ${at.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

const ResultsTopBar = (props: {
  siteName: string;
  href: string;
  /** true khi chứng thư số hợp lệ — ổ khoá xanh, như bản thiết kế */
  secure: boolean;
  doneCount: number;
  totalCount: number;
  elapsedMs: number;
  scannedAt: Date;
  onRescan: () => void;
}): JSX.Element => {
  const finished = props.doneCount >= props.totalCount;
  return (
    <Bar>
      <Inner>
        <DomainChip href={props.href} target="_blank" rel="noreferrer">
          <LockIcon tone={props.secure ? 'var(--hvn-success)' : 'var(--hvn-gray-400)'} />
          <span>{props.siteName}</span>
        </DomainChip>
        <Meta>
          Quét lúc {formatScanTime(props.scannedAt)} ·{' '}
          {finished ? `hoàn tất trong ${formatSeconds(props.elapsedMs)}` : 'đang quét'} ·{' '}
          {props.doneCount}/{props.totalCount} hạng mục
        </Meta>
        <Actions>
          <GhostButton type="button" onClick={props.onRescan}>
            <RescanIcon />
            <span>Quét lại</span>
          </GhostButton>
          <PrimaryButton type="button" onClick={() => window.print()}>
            <DownloadIcon />
            <span>Xuất báo cáo PDF</span>
          </PrimaryButton>
        </Actions>
      </Inner>
    </Bar>
  );
};

export default ResultsTopBar;
