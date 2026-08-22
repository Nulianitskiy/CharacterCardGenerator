import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { CharacterCard } from '../types';
import { getHangingPortraitAspect, POINTER_DRAG_THRESHOLD_PX, type CardsPerPageOption } from '../constants';
import { Card } from './Card';
import { CardFace } from './CardFace';
import { ImageUpload } from './ImageUpload';
import './CardGrid.css';

interface CardGridProps {
  cards: CharacterCard[];
  cardsPerPage: CardsPerPageOption;
  onRemoveCard: (id: string) => void;
  onSelectCard: (id: string) => void;
  onImagesUploaded: (cards: CharacterCard[]) => void;
  onReorderCards: (orderedIds: string[]) => void;
  onReplaceCardFiles: (id: string, files: File[]) => void;
  selectedCardId: string | null;
}

function insertIndexFromPoint(
  clientX: number,
  clientY: number,
  grid: HTMLElement,
  otherIds: string[]
): number {
  if (otherIds.length === 0) return 0;

  let best = 0;
  let bestDist = Infinity;
  const rects: DOMRect[] = [];

  for (let i = 0; i < otherIds.length; i++) {
    const el = grid.querySelector(`[data-card-id="${CSS.escape(otherIds[i])}"]`);
    if (!(el instanceof HTMLElement)) continue;
    const rect = el.getBoundingClientRect();
    rects[i] = rect;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  const closest = rects[best];
  if (!closest) return otherIds.length;
  return clientX > closest.left + closest.width / 2 ? best + 1 : best;
}

export function CardGrid({
  cards,
  cardsPerPage,
  onRemoveCard,
  onSelectCard,
  onImagesUploaded,
  onReorderCards,
  onReplaceCardFiles,
  selectedCardId,
}: CardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef(cards);
  const suppressClickRef = useRef<string | null>(null);
  const [drag, setDrag] = useState<{
    id: string;
    insertIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const pendingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const dragRef = useRef(drag);

  useLayoutEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useLayoutEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const endDrag = useCallback(() => {
    const current = dragRef.current;
    pendingRef.current = null;
    if (!current) return;

    const list = cardsRef.current;
    const fromIndex = list.findIndex((card) => card.id === current.id);
    if (fromIndex === -1) {
      setDrag(null);
      return;
    }

    const without = list.filter((card) => card.id !== current.id);
    const next = [
      ...without.slice(0, current.insertIndex),
      list[fromIndex],
      ...without.slice(current.insertIndex),
    ];
    const sameOrder = next.every((card, index) => card.id === list[index]?.id);
    if (!sameOrder) onReorderCards(next.map((card) => card.id));
    suppressClickRef.current = current.id;
    setDrag(null);
  }, [onReorderCards]);

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      const pending = pendingRef.current;
      const current = dragRef.current;
      if (!pending && !current) return;

      if (!current && pending) {
        const dist = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (dist < POINTER_DRAG_THRESHOLD_PX) return;
        const others = cardsRef.current.filter((card) => card.id !== pending.id).map((card) => card.id);
        const grid = gridRef.current;
        const insertIndex = grid
          ? insertIndexFromPoint(event.clientX, event.clientY, grid, others)
          : others.length;
        setDrag({
          id: pending.id,
          insertIndex,
          x: event.clientX,
          y: event.clientY,
          width: pending.width,
          height: pending.height,
          offsetX: pending.offsetX,
          offsetY: pending.offsetY,
        });
        return;
      }

      if (!current) return;
      const others = cardsRef.current.filter((card) => card.id !== current.id).map((card) => card.id);
      const grid = gridRef.current;
      const insertIndex = grid
        ? insertIndexFromPoint(event.clientX, event.clientY, grid, others)
        : current.insertIndex;
      setDrag({
        ...current,
        insertIndex,
        x: event.clientX,
        y: event.clientY,
      });
    };

    const onUp = () => endDrag();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [endDrag]);

  const handlePointerDragStart = useCallback(
    (event: PointerEvent<HTMLElement>, id: string) => {
      if (event.button !== 0) return;
      const wrap = event.currentTarget.closest('.card-wrap');
      if (!(wrap instanceof HTMLElement)) return;
      const rect = wrap.getBoundingClientRect();
      pendingRef.current = {
        id,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      };
    },
    []
  );

  const handleSelectCard = useCallback(
    (id: string) => {
      if (suppressClickRef.current === id) {
        suppressClickRef.current = null;
        return;
      }
      onSelectCard(id);
    },
    [onSelectCard]
  );

  if (cards.length === 0) {
    return <ImageUpload variant="zone" onImagesUploaded={onImagesUploaded} />;
  }

  const aspectRatio = getHangingPortraitAspect(cardsPerPage);
  const draggedCard = drag ? cards.find((card) => card.id === drag.id) : null;
  const others = drag ? cards.filter((card) => card.id !== drag.id) : cards;
  const slots: Array<{ type: 'card'; card: CharacterCard } | { type: 'placeholder' }> = [];

  if (drag) {
    others.forEach((card, index) => {
      if (index === drag.insertIndex) slots.push({ type: 'placeholder' });
      slots.push({ type: 'card', card });
    });
    if (drag.insertIndex >= others.length) slots.push({ type: 'placeholder' });
  } else {
    cards.forEach((card) => slots.push({ type: 'card', card }));
  }

  return (
    <div ref={gridRef} className={`card-grid${drag ? ' is-reordering' : ''}`}>
      {slots.map((slot) => {
        if (slot.type === 'placeholder') {
          return (
            <div
              key="placeholder"
              className="card-placeholder"
              style={{ aspectRatio }}
              aria-hidden="true"
            />
          );
        }

        const card = slot.card;
        return (
          <Card
            key={card.id}
            card={card}
            cardsPerPage={cardsPerPage}
            onRemove={onRemoveCard}
            onSelect={handleSelectCard}
            isSelected={card.id === selectedCardId}
            onPointerDragStart={handlePointerDragStart}
            onFilesDropped={onReplaceCardFiles}
          />
        );
      })}
      <ImageUpload
        variant="tile"
        aspectRatio={aspectRatio}
        onImagesUploaded={onImagesUploaded}
      />
      {drag && draggedCard && (
        <div
          className="card-ghost"
          style={{
            width: drag.width,
            height: drag.height,
            transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)`,
          }}
        >
          <CardFace card={draggedCard} side="a" />
        </div>
      )}
    </div>
  );
}
