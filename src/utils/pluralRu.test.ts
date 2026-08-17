import { describe, expect, it } from 'vitest';
import { pluralRu } from './pluralRu';

describe('pluralRu', () => {
  it('picks one / few / many forms', () => {
    expect(pluralRu(1, 'карточка', 'карточки', 'карточек')).toBe('карточка');
    expect(pluralRu(2, 'карточка', 'карточки', 'карточек')).toBe('карточки');
    expect(pluralRu(5, 'карточка', 'карточки', 'карточек')).toBe('карточек');
    expect(pluralRu(11, 'карточка', 'карточки', 'карточек')).toBe('карточек');
    expect(pluralRu(21, 'карточка', 'карточки', 'карточек')).toBe('карточка');
  });
});
