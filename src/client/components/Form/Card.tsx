import styled from '@emotion/styled';

import { type ReactNode } from 'react';
import ErrorBoundary from 'client/components/misc/ErrorBoundary';
import { useCardMeta } from 'client/hvn/cardMeta';

/**
 * Vỏ chung của mọi thẻ kết quả.
 *
 * Đã port sang ngôn ngữ thị giác HVN theo bản thiết kế (khối thẻ ở màn Trang
 * kết quả): nền trắng, bo 14px, đổ bóng mềm, đầu thẻ có chấm mức độ + tiêu đề +
 * nhãn nhóm, phân cách bằng viền #F0F0F0.
 *
 * Ruột thẻ KHÔNG đổi — bản đồ, biểu đồ, ảnh chụp của 39 card giữ nguyên. Bản
 * mock vẽ mọi thẻ thành danh sách khoá–giá trị, nhưng đó là dữ liệu mẫu cho một
 * website, không phải chỉ thị bỏ bản đồ.
 *
 * CẢNH BÁO KHI SỬA: `StyledCard` còn được 9 chỗ khác dùng qua
 * `styled(StyledCard)` (Nav, NoResults, PageError, NotFound, Home, About,
 * SelfScanMsg, Loader). Vì vậy `padding: 1rem` phải giữ nguyên — đầu thẻ tràn
 * ra sát viền bằng margin âm, chứ không bằng cách bỏ padding của vỏ.
 */

export const StyledCard = styled.section<{ styles?: string }>`
  background: var(--hvn-white);
  color: var(--hvn-ink);
  box-shadow: var(--shadow-sm);
  border-radius: 14px;
  padding: 1rem;
  position: relative;
  max-height: 54rem;
  overflow: auto;
  ${(props) => props.styles}
`;

const CardHead = styled.div`
  /* Margin âm để viền phân cách chạy hết chiều ngang, mà vỏ vẫn giữ padding
     cho 9 chỗ dùng StyledCard trực tiếp. */
  margin: -1rem -1rem 0.75rem;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 9px;
  position: sticky;
  top: -1rem;
  background: var(--hvn-white);
  border-radius: 14px 14px 0 0;
  z-index: 2;
`;

const Dot = styled.span<{ tone: string }>`
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: var(--r-pill);
  background: ${(p) => p.tone};
`;

const CardTitle = styled.h3`
  margin: 0;
  min-width: 0;
  font-size: 14px;
  font-weight: var(--w-semibold);
  color: var(--hvn-gray-900);
  line-height: var(--lh-snug);

  /* Một số tiêu đề có favicon hoặc là liên kết */
  img {
    width: 1.25rem;
    border-radius: var(--r-xs);
    vertical-align: -0.2em;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
`;

const GroupTag = styled.div`
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--hvn-gray-400);
  white-space: nowrap;
`;

/**
 * Neo cho nút hành động của upstream. `ActionButtons` dùng
 * `position: absolute; top/right`, nên nó cần một hộp relative có kích thước
 * thật — nếu không nó sẽ neo vào cả thẻ và đè lên nhãn nhóm.
 */
const ActionSlot = styled.div`
  flex: none;
  position: relative;
  width: 3.25rem;
  height: 1.5rem;
  margin-left: 4px;
`;

interface CardProps {
  children: ReactNode;
  heading?: string;
  styles?: string;
  actionButtons?: ReactNode | undefined;
}

export const Card = (props: CardProps): JSX.Element => {
  const { children, heading, styles, actionButtons } = props;
  const meta = useCardMeta();

  return (
    <ErrorBoundary title={heading}>
      <StyledCard styles={styles}>
        {heading ? (
          <CardHead>
            <Dot tone={meta?.dotTone || 'var(--hvn-gray-300)'} />
            <CardTitle className="inner-heading">{heading}</CardTitle>
            {meta?.groupName && <GroupTag>{meta.groupName}</GroupTag>}
            {actionButtons && <ActionSlot>{actionButtons}</ActionSlot>}
          </CardHead>
        ) : (
          actionButtons
        )}
        {children}
      </StyledCard>
    </ErrorBoundary>
  );
};

export default StyledCard;
