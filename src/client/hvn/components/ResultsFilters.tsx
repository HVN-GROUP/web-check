/**
 * Dải nút lọc theo nhóm + hộp tìm kiếm, đặt trên lưới thẻ kết quả.
 *
 * Số đo theo bản thiết kế: nút bo tròn 999px padding 9px 16px cỡ 13.5px đậm
 * 600, nút đang chọn nền đỏ chữ trắng; hộp tìm cao 40px viền #DCDCDC bo 8px
 * rộng tối thiểu 250px, có icon kính lúp #BFBFBF.
 */

import styled from '@emotion/styled';
import { HVN_GROUPS, type HvnGroupId } from '../groups';
import { UI } from '../labels';

export type FilterValue = 'all' | HvnGroupId;

const Wrap = styled.div`
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 var(--page-pad);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const Pills = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Pill = styled.button<{ active: boolean }>`
  padding: 9px 16px;
  border-radius: var(--r-pill);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: var(--w-semibold);
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid ${(p) => (p.active ? 'var(--hvn-red)' : 'var(--hvn-gray-300)')};
  background: ${(p) => (p.active ? 'var(--hvn-red)' : 'var(--hvn-white)')};
  color: ${(p) => (p.active ? 'var(--hvn-white)' : 'var(--hvn-gray-600)')};
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);

  &:hover {
    border-color: var(--hvn-red);
    color: ${(p) => (p.active ? 'var(--hvn-white)' : 'var(--hvn-red)')};
  }
`;

const Search = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--hvn-white);
  border: 1px solid var(--hvn-gray-300);
  border-radius: var(--r-sm);
  height: 40px;
  padding: 0 14px;
  min-width: 250px;

  &:focus-within {
    border-color: var(--hvn-red);
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--hvn-gray-900);
  }
`;

const Count = styled.div`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--hvn-gray);
  white-space: nowrap;
`;

const SearchIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--hvn-gray-400)"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
    style={{ flex: 'none' }}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const ResultsFilters = (props: {
  filter: FilterValue;
  onFilter: (v: FilterValue) => void;
  query: string;
  onQuery: (v: string) => void;
  shown: number;
  total: number;
}): JSX.Element => (
  <Wrap>
    <Pills>
      <Pill
        type="button"
        active={props.filter === 'all'}
        onClick={() => props.onFilter('all')}
        aria-pressed={props.filter === 'all'}
      >
        {UI.filterAll}
      </Pill>
      {HVN_GROUPS.map((g) => (
        <Pill
          key={g.id}
          type="button"
          active={props.filter === g.id}
          onClick={() => props.onFilter(g.id)}
          aria-pressed={props.filter === g.id}
        >
          {g.name}
        </Pill>
      ))}
    </Pills>
    <Count>
      {props.shown}/{props.total} {UI.itemsSuffix}
    </Count>
    <Search>
      <SearchIcon />
      <input
        value={props.query}
        onChange={(e) => props.onQuery(e.target.value)}
        placeholder={UI.searchPlaceholder}
        aria-label={UI.searchPlaceholder}
      />
    </Search>
  </Wrap>
);

export default ResultsFilters;
