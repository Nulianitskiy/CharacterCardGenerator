import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
} from 'react';
import type { GameObject } from '../types';
import {
  POINTER_DRAG_THRESHOLD_PX,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
} from '../constants';
import { ImageUpload, type UploadIngestResult } from './ImageUpload';
import { ObjectDescriptionFace, ObjectShirtFace } from './ObjectFaces';
import './ObjectGrid.css';

const OBJECT_FACE_ASPECT = getGameObjectCellWidth() / getGameObjectCellHeight();

interface ObjectGridProps {
  objects: GameObject[];
  selectedObjectId: string | null;
  ingest: (files: FileList) => Promise<UploadIngestResult<GameObject>>;
  onAddObjects: (objects: GameObject[]) => void;
  onSelectObject: (id: string) => void;
  onRemoveObject: (id: string) => void;
  onReorderObjects: (orderedIds: string[]) => void;
  onReplaceObjectFiles: (id: string, files: File[]) => void;
}

const isFileDrag = (event: DragEvent): boolean =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

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
    const el = grid.querySelector(`[data-object-id="${CSS.escape(otherIds[i])}"]`);
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

export function ObjectGrid({
  objects,
  selectedObjectId,
  ingest,
  onAddObjects,
  onSelectObject,
  onRemoveObject,
  onReorderObjects,
  onReplaceObjectFiles,
}: ObjectGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef(objects);
  const suppressClickRef = useRef<string | null>(null);
  const [fileOverId, setFileOverId] = useState<string | null>(null);
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
    objectsRef.current = objects;
  }, [objects]);

  useLayoutEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const endDrag = useCallback(() => {
    const current = dragRef.current;
    pendingRef.current = null;
    if (!current) return;

    const list = objectsRef.current;
    const fromIndex = list.findIndex((item) => item.id === current.id);
    if (fromIndex === -1) {
      setDrag(null);
      return;
    }

    const without = list.filter((item) => item.id !== current.id);
    const next = [
      ...without.slice(0, current.insertIndex),
      list[fromIndex],
      ...without.slice(current.insertIndex),
    ];
    const sameOrder = next.every((item, index) => item.id === list[index]?.id);
    if (!sameOrder) onReorderObjects(next.map((item) => item.id));
    suppressClickRef.current = current.id;
    setDrag(null);
  }, [onReorderObjects]);

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      const pending = pendingRef.current;
      const current = dragRef.current;
      if (!pending && !current) return;

      if (!current && pending) {
        const dist = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (dist < POINTER_DRAG_THRESHOLD_PX) return;
        const others = objectsRef.current
          .filter((item) => item.id !== pending.id)
          .map((item) => item.id);
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
      const others = objectsRef.current
        .filter((item) => item.id !== current.id)
        .map((item) => item.id);
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

  const handlePointerDown = (event: PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.object-tile-remove')) return;
    const tile = event.currentTarget;
    const rect = tile.getBoundingClientRect();
    pendingRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const handleTileClick = (id: string) => {
    if (suppressClickRef.current === id) {
      suppressClickRef.current = null;
      return;
    }
    onSelectObject(id);
  };

  if (objects.length === 0) {
    return (
      <ImageUpload
        variant="zone"
        ingest={ingest}
        onUploaded={onAddObjects}
        labels={{
          zoneAria: 'Загрузить изображения предметов',
          zoneText: 'Перетащите изображения предметов сюда или нажмите, чтобы выбрать',
        }}
      />
    );
  }

  const draggedObject = drag ? objects.find((item) => item.id === drag.id) : null;
  const others = drag ? objects.filter((item) => item.id !== drag.id) : objects;
  const slots: Array<
    { type: 'object'; object: GameObject; index: number } | { type: 'placeholder' }
  > = [];

  if (drag) {
    others.forEach((object, idx) => {
      if (idx === drag.insertIndex) slots.push({ type: 'placeholder' });
      slots.push({ type: 'object', object, index: idx });
    });
    if (drag.insertIndex >= others.length) slots.push({ type: 'placeholder' });
  } else {
    objects.forEach((object, idx) => slots.push({ type: 'object', object, index: idx }));
  }

  return (
    <div ref={gridRef} className={`object-grid${drag ? ' is-reordering' : ''}`}>
      {slots.map((slot) => {
        if (slot.type === 'placeholder') {
          return (
            <div
              key="placeholder"
              className="object-placeholder"
              style={{ aspectRatio: `${2 * OBJECT_FACE_ASPECT} / 1` }}
              aria-hidden="true"
            />
          );
        }

        const { object, index } = slot;
        const isFileOver = fileOverId === object.id;
        return (
          <article
            key={object.id}
            data-object-id={object.id}
            className={`object-tile${object.id === selectedObjectId ? ' selected' : ''}${
              isFileOver ? ' file-over' : ''
            }`}
            role="button"
            tabIndex={0}
            aria-label={`Объект ${object.name || index + 1}, открыть настройки`}
            aria-pressed={object.id === selectedObjectId}
            onPointerDown={(event) => handlePointerDown(event, object.id)}
            onClick={() => handleTileClick(object.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectObject(object.id);
              }
            }}
            onDragEnter={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              setFileOverId(object.id);
            }}
            onDragOver={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
            }}
            onDragLeave={(event) => {
              if (!isFileDrag(event)) return;
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.contains(next)) return;
              setFileOverId((prev) => (prev === object.id ? null : prev));
            }}
            onDrop={(event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              event.stopPropagation();
              setFileOverId(null);
              const files = Array.from(event.dataTransfer.files);
              if (files.length > 0) onReplaceObjectFiles(object.id, files);
            }}
          >
            <div className="object-pair" style={{ aspectRatio: `${2 * OBJECT_FACE_ASPECT} / 1` }}>
              <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
                <ObjectShirtFace object={object} />
              </div>
              <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
                <ObjectDescriptionFace object={object} />
              </div>
            </div>
            <span className="object-tile-index" aria-hidden="true">
              {index + 1}
            </span>
            <button
              type="button"
              className="object-tile-remove"
              aria-label="Удалить объект"
              title="Удалить объект"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveObject(object.id);
              }}
            >
              ×
            </button>
          </article>
        );
      })}
      <ImageUpload
        variant="tile"
        ingest={ingest}
        onUploaded={onAddObjects}
        aspectRatio={2 * OBJECT_FACE_ASPECT}
        labels={{ addAria: 'Добавить объект', addTitle: 'Добавить объект' }}
      />
      {drag && draggedObject && (
        <div
          className="object-ghost"
          style={{
            width: drag.width,
            height: drag.height,
            transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)`,
          }}
        >
          <div className="object-pair" style={{ aspectRatio: `${2 * OBJECT_FACE_ASPECT} / 1` }}>
            <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
              <ObjectShirtFace object={draggedObject} />
            </div>
            <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
              <ObjectDescriptionFace object={draggedObject} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
