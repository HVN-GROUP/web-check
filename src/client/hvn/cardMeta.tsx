/**
 * Truyền thông tin phụ của mỗi thẻ xuống vỏ `Form/Card` mà không phải sửa 39
 * component card.
 *
 * Bản thiết kế vẽ đầu mỗi thẻ có: một chấm màu theo mức độ nặng nhất tìm thấy,
 * tiêu đề, và nhãn nhóm chữ mono ở góc phải. Vỏ `Card` chỉ nhận `heading` và
 * `actionButtons` — nó không biết card id, nên không tự tra được nhóm hay mức
 * độ.
 *
 * Cách rẻ nhất: `Results.tsx` bọc mỗi thẻ bằng provider này, `Card` đọc ra.
 * Hai chỗ sửa, không chỗ nào là component card.
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface CardMeta {
  cardId: string;
  /** Nhãn nhóm chữ mono ở góc phải đầu thẻ, ví dụ "Bảo mật" */
  groupName?: string;
  /** Màu chấm — token CSS, theo mức độ nặng nhất của thẻ */
  dotTone: string;
}

const CardMetaContext = createContext<CardMeta | null>(null);

export const CardMetaProvider = (props: { value: CardMeta; children: ReactNode }) => (
  <CardMetaContext.Provider value={props.value}>{props.children}</CardMetaContext.Provider>
);

/** Trả về null khi thẻ được render ngoài trang kết quả — vỏ Card phải chịu được. */
export const useCardMeta = (): CardMeta | null => useContext(CardMetaContext);
