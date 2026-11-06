import { useState, useCallback, useEffect, useRef } from 'react';
import { CardGrid } from './components/CardGrid';
import { CardOptionsMenu } from './components/CardOptionsMenu';
import { ObjectGrid } from './components/ObjectGrid';
import { ObjectOptionsMenu, type ObjectPatch } from './components/ObjectOptionsMenu';
import { generatePDF, generateObjectsPDF } from './utils/pdfGenerator';
import { generateId } from './utils/generateId';
import { cloneDndStats } from './utils/dndStats';
import { pluralRu } from './utils/pluralRu';
import type { CharacterCard, GameObject, NameSettings, ImageFillMode, ImageFocus, DndStatsSettings, PawnSize } from './types';
import { DEFAULT_IMAGE_FOCUS } from './types';
import { applyReplacedImage, filesFromClipboard, ingestImageFiles, ingestImageFilesAsObjects, ingestReplacementAndExtras } from './utils/imageIngest';
import { isPawnLayout, getItemsPerPage, OBJECTS_PER_PAGE, PAWNS_PER_PAGE, type CardsPerPageOption } from './constants';
import { pawnPageCount } from './utils/pawnLayout';
import { objectPageCount } from './utils/objectLayout';
import './styles/cardVisuals.css';
import './App.css';

type SheetMode = 'cards' | 'objects';

function App() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [sheetMode, setSheetMode] = useState<SheetMode>('cards');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPageOption>(4);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const generatingLockRef = useRef(false);
  const cardsRef = useRef(cards);
  const objectsRef = useRef(objects);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (cards.length === 0 && objects.length === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cards.length, objects.length]);

  useEffect(() => {
    if (!selectedCardId && !selectedObjectId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCardId(null);
        setSelectedObjectId(null);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('.sidebar') ||
        target.closest('.card') ||
        target.closest('.object-tile') ||
        target.closest('.side-preview-modal')
      ) {
        return;
      }
      setSelectedCardId(null);
      setSelectedObjectId(null);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [selectedCardId, selectedObjectId]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    };

    const onPaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target) || isTypingTarget(document.activeElement)) return;
      const files = filesFromClipboard(event);
      if (files.length === 0) return;
      event.preventDefault();
      if (sheetMode === 'objects') {
        void ingestImageFilesAsObjects(files).then(({ items, errors }) => {
          setIngestError(errors.length > 0 ? errors.join('\n') : null);
          if (items.length > 0) {
            setObjects((prev) => [...prev, ...items]);
          }
        });
        return;
      }
      void ingestImageFiles(files).then(({ cards: newCards, errors }) => {
        setIngestError(errors.length > 0 ? errors.join('\n') : null);
        if (newCards.length > 0) {
          setCards((prev) => [...prev, ...newCards]);
        }
      });
    };

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [sheetMode]);

  const handleImagesUploaded = useCallback((newCards: CharacterCard[]) => {
    setCards((prev) => [...prev, ...newCards]);
  }, []);

  const handleRemoveCard = useCallback((id: string) => {
    const card = cardsRef.current.find((item) => item.id === id);
    if (card) URL.revokeObjectURL(card.imageUrl);
    setCards((prev) => prev.filter((item) => item.id !== id));
    setSelectedCardId((prevSelected) => (prevSelected === id ? null : prevSelected));
  }, []);

  const handleSelectCard = useCallback((id: string) => {
    setSelectedCardId((prev) => (prev === id ? null : id));
  }, []);

  const handleCloseOptions = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  const handleDuplicateCard = useCallback((id: string) => {
    const source = cardsRef.current.find((card) => card.id === id);
    if (!source) return;

    const imageUrl = URL.createObjectURL(source.file);
    const duplicatedCard: CharacterCard = {
      ...source,
      id: generateId(),
      imageUrl,
      nameSettings: { ...source.nameSettings },
      imageFillMode: source.imageFillMode ?? 'cover',
      imageFocus: source.imageFocus ? { ...source.imageFocus } : { ...DEFAULT_IMAGE_FOCUS },
      dndStats: cloneDndStats(source.dndStats),
    };

    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index === -1) {
        URL.revokeObjectURL(imageUrl);
        return prev;
      }
      const next = [...prev];
      next.splice(index + 1, 0, duplicatedCard);
      return next;
    });
  }, []);

  const handleMoveCardUp = useCallback((id: string) => {
    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index <= 0) return prev;

      const newCards = [...prev];
      [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
      return newCards;
    });
  }, []);

  const handleMoveCardDown = useCallback((id: string) => {
    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;

      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
      return newCards;
    });
  }, []);

  const handleUpdateNameSettings = useCallback((id: string, settings: NameSettings) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, nameSettings: settings } : card
      )
    );
  }, []);

  const handleUpdateImageFillMode = useCallback((id: string, imageFillMode: ImageFillMode) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, imageFillMode } : card
      )
    );
  }, []);

  const handleUpdateImageFocus = useCallback((id: string, imageFocus: ImageFocus) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, imageFocus } : card))
    );
  }, []);

  const handleReplaceCardFiles = useCallback((id: string, files: File[]) => {
    void ingestReplacementAndExtras(files).then(({ replacement, extraCards, errors }) => {
      setIngestError(errors.length > 0 ? errors.join('\n') : null);
      if (!replacement && extraCards.length === 0) return;
      setCards((prev) => {
        const next = replacement
          ? prev.map((card) => (card.id === id ? applyReplacedImage(card, replacement) : card))
          : prev;
        return extraCards.length > 0 ? [...next, ...extraCards] : next;
      });
    });
  }, []);

  const handleReorderCards = useCallback((orderedIds: string[]) => {
    setCards((prev) => {
      const byId = new Map(prev.map((card) => [card.id, card]));
      return orderedIds
        .map((id) => byId.get(id))
        .filter((card): card is CharacterCard => Boolean(card));
    });
  }, []);

  const handleUpdateDndStats = useCallback((id: string, dndStats: DndStatsSettings) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, dndStats } : card))
    );
  }, []);

  const handleUpdatePawnSize = useCallback((id: string, pawnSize: PawnSize) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, pawnSize } : card))
    );
  }, []);

  // --- Object handlers ------------------------------------------------------

  const handleAddObjects = useCallback((newObjects: GameObject[]) => {
    setObjects((prev) => [...prev, ...newObjects]);
  }, []);

  const handleRemoveObject = useCallback((id: string) => {
    const object = objectsRef.current.find((item) => item.id === id);
    if (object) URL.revokeObjectURL(object.imageUrl);
    setObjects((prev) => prev.filter((item) => item.id !== id));
    setSelectedObjectId((prevSelected) => (prevSelected === id ? null : prevSelected));
  }, []);

  const handleSelectObject = useCallback((id: string) => {
    setSelectedObjectId((prev) => (prev === id ? null : id));
  }, []);

  const handleDuplicateObject = useCallback((id: string) => {
    const source = objectsRef.current.find((object) => object.id === id);
    if (!source) return;

    const imageUrl = URL.createObjectURL(source.file);
    setObjects((prev) => {
      const index = prev.findIndex((object) => object.id === id);
      if (index === -1) {
        URL.revokeObjectURL(imageUrl);
        return prev;
      }
      const next = [...prev];
      next.splice(index + 1, 0, { ...source, id: generateId(), imageUrl });
      return next;
    });
  }, []);

  const handleMoveObjectUp = useCallback((id: string) => {
    setObjects((prev) => {
      const index = prev.findIndex((object) => object.id === id);
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveObjectDown = useCallback((id: string) => {
    setObjects((prev) => {
      const index = prev.findIndex((object) => object.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleUpdateObject = useCallback((id: string, patch: ObjectPatch) => {
    setObjects((prev) =>
      prev.map((object) => (object.id === id ? { ...object, ...patch } : object))
    );
  }, []);

  /** First file replaces the object image; remaining files are appended as new objects. */
  const handleReplaceObjectImage = useCallback((id: string, files: File[]) => {
    void ingestImageFilesAsObjects(files).then(({ items, errors }) => {
      setIngestError(errors.length > 0 ? errors.join('\n') : null);
      if (items.length === 0) return;

      const [replacement, ...extras] = items;
      const current = objectsRef.current.find((object) => object.id === id);
      if (current && replacement) {
        URL.revokeObjectURL(current.imageUrl);
      } else if (replacement) {
        URL.revokeObjectURL(replacement.imageUrl);
      }

      setObjects((prev) => {
        const next = replacement
          ? prev.map((object) =>
              object.id === id
                ? { ...object, file: replacement.file, imageUrl: replacement.imageUrl }
                : object
            )
          : prev;
        return extras.length > 0 ? [...next, ...extras] : next;
      });
    });
  }, []);

  const handleClearAll = useCallback(() => {
    const objectMode = sheetMode === 'objects';
    const message = objectMode
      ? 'Удалить все объекты? Это действие нельзя отменить.'
      : 'Удалить все карточки? Это действие нельзя отменить.';
    if (!window.confirm(message)) {
      return;
    }
    if (objectMode) {
      objectsRef.current.forEach((object) => URL.revokeObjectURL(object.imageUrl));
      setObjects([]);
      setSelectedObjectId(null);
    } else {
      cardsRef.current.forEach((card) => URL.revokeObjectURL(card.imageUrl));
      setCards([]);
      setSelectedCardId(null);
    }
  }, [sheetMode]);

  const handleGeneratePDF = useCallback(async () => {
    const objectMode = sheetMode === 'objects';
    const activeItems = objectMode ? objects : cards;
    if (activeItems.length === 0 || generatingLockRef.current) return;
    generatingLockRef.current = true;

    const previewTab = window.open('about:blank', 'initiative-cards-pdf');
    if (previewTab) {
      previewTab.document.open();
      previewTab.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Создание PDF…</title>
    <style>
      html, body {
        margin: 0;
        height: 100%;
        background: #1a1612;
        color: #cdad6d;
        font-family: Georgia, serif;
      }
      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
    </style>
  </head>
  <body>Создание PDF…</body>
</html>`);
      previewTab.document.close();
    }

    setIsGenerating(true);
    setGeneratingProgress({ completed: 0, total: activeItems.length });
    try {
      const { url, filename } = objectMode
        ? await generateObjectsPDF(objects, (completed, total) => {
            setGeneratingProgress({ completed, total });
          })
        : await generatePDF(cards, cardsPerPage, (completed, total) => {
            setGeneratingProgress({ completed, total });
          });
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = url;

      if (previewTab && !previewTab.closed) {
        previewTab.location.replace(url);
        previewTab.focus();
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        alert('Разрешите всплывающие окна, чтобы открыть PDF. Файл также скачан.');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      alert('Не удалось создать PDF. Попробуйте ещё раз.');
    } finally {
      generatingLockRef.current = false;
      setIsGenerating(false);
      setGeneratingProgress(null);
    }
  }, [cards, objects, cardsPerPage, sheetMode]);

  const itemsPerPage = getItemsPerPage(cardsPerPage);
  const pawnMode = isPawnLayout(cardsPerPage);
  const objectMode = sheetMode === 'objects';
  const activeCount = objectMode ? objects.length : cards.length;
  const pageCount = objectMode
    ? objectPageCount(objects)
    : pawnMode
      ? pawnPageCount(cards)
      : Math.ceil(cards.length / itemsPerPage);

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;
  const selectedIndex = selectedCardId ? cards.findIndex((c) => c.id === selectedCardId) : -1;
  const selectedObject = selectedObjectId
    ? objects.find((o) => o.id === selectedObjectId)
    : null;
  const selectedObjectIndex = selectedObjectId
    ? objects.findIndex((o) => o.id === selectedObjectId)
    : -1;

  return (
    <div className={`app ${selectedCard || selectedObject ? 'with-sidebar' : ''}`}>
      <div className="app-content">
        <header className="header">
          <h1 className="title">Генератор карточек инициативы</h1>
          <p className="subtitle">
            Создавайте складывающиеся карточки инициативы для ширмы мастера
          </p>
        </header>

        <main className="main">
          <section className="layout-section">
            <div className="layout-toggle">
              <span className="layout-label">Режим:</span>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${!objectMode && cardsPerPage === 4 ? 'active' : ''}`}
                  aria-pressed={!objectMode && cardsPerPage === 4}
                  onClick={() => {
                    setSheetMode('cards');
                    setCardsPerPage(4);
                  }}
                >
                  Инициативки
                  <span className="toggle-hint">4 на лист</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${!objectMode && cardsPerPage === 20 ? 'active' : ''}`}
                  aria-pressed={!objectMode && cardsPerPage === 20}
                  onClick={() => {
                    setSheetMode('cards');
                    setCardsPerPage(20);
                  }}
                >
                  Павны
                  <span className="toggle-hint">до {PAWNS_PER_PAGE} на лист</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${objectMode ? 'active' : ''}`}
                  aria-pressed={objectMode}
                  onClick={() => setSheetMode('objects')}
                >
                  Объекты
                  <span className="toggle-hint">до {OBJECTS_PER_PAGE} на лист</span>
                </button>
              </div>
            </div>
          </section>

          <section className={`preview-section ${activeCount === 0 ? 'is-empty' : ''}`}>
            {activeCount > 0 && (
              <div className="preview-header">
                <h2 className="preview-title">
                  {objectMode ? 'Объекты' : pawnMode ? 'Павны' : 'Карточки'}
                  <span className="card-count">
                    {objectMode
                      ? `${objects.length} ${pluralRu(objects.length, 'объект', 'объекта', 'объектов')} • `
                      : `${cards.length} ${pluralRu(cards.length, 'изображение', 'изображения', 'изображений')} • `}
                    {pageCount} {pluralRu(pageCount, 'страница', 'страницы', 'страниц')}
                  </span>
                </h2>
                <div className="preview-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearAll}
                    disabled={isGenerating}
                  >
                    Очистить все
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner" />
                        {generatingProgress
                          ? `Создание ${generatingProgress.completed}/${generatingProgress.total}`
                          : 'Создание...'}
                      </>
                    ) : (
                      <>
                        <svg
                          className="btn-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        Создать PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {ingestError && (
              <p className="ingest-error" role="alert">
                {ingestError}
              </p>
            )}
            {objectMode ? (
              <ObjectGrid
                objects={objects}
                selectedObjectId={selectedObjectId}
                ingest={ingestImageFilesAsObjects}
                onAddObjects={handleAddObjects}
                onSelectObject={handleSelectObject}
                onRemoveObject={handleRemoveObject}
              />
            ) : (
              <CardGrid
                cards={cards}
                cardsPerPage={cardsPerPage}
                onRemoveCard={handleRemoveCard}
                onSelectCard={handleSelectCard}
                onImagesUploaded={handleImagesUploaded}
                onReorderCards={handleReorderCards}
                onReplaceCardFiles={handleReplaceCardFiles}
                selectedCardId={selectedCardId}
              />
            )}
          </section>
        </main>

        <footer className="footer">
          <p>
            {objectMode
              ? `Карточки предметов • до ${OBJECTS_PER_PAGE} объектов на лист A4 • вырежьте пару «рубашка + описание» и склейте`
              : pawnMode
                ? `Складывающиеся павны • до ${PAWNS_PER_PAGE} средних на лист A4 • сложите по линии посередине и вырежьте подставку`
                : 'Горизонтальные складывающиеся карточки • 4 карточки на лист A4 • сложите по вертикали и повесьте на ширму мастера'}
          </p>
        </footer>
      </div>

      {selectedCard && !objectMode && (
        <aside className="sidebar">
          <CardOptionsMenu
            key={selectedCard.id}
            card={selectedCard}
            cardsPerPage={cardsPerPage}
            onClose={handleCloseOptions}
            onRemove={handleRemoveCard}
            onDuplicate={handleDuplicateCard}
            onMoveUp={handleMoveCardUp}
            onMoveDown={handleMoveCardDown}
            onUpdateNameSettings={handleUpdateNameSettings}
            onUpdateImageFillMode={handleUpdateImageFillMode}
            onUpdateImageFocus={handleUpdateImageFocus}
            onUpdateDndStats={handleUpdateDndStats}
            onUpdatePawnSize={handleUpdatePawnSize}
            onReplaceImage={handleReplaceCardFiles}
            canMoveUp={selectedIndex > 0}
            canMoveDown={selectedIndex < cards.length - 1}
          />
        </aside>
      )}

      {selectedObject && objectMode && (
        <aside className="sidebar">
          <ObjectOptionsMenu
            key={selectedObject.id}
            object={selectedObject}
            onClose={() => setSelectedObjectId(null)}
            onRemove={handleRemoveObject}
            onDuplicate={handleDuplicateObject}
            onMoveUp={handleMoveObjectUp}
            onMoveDown={handleMoveObjectDown}
            onUpdate={handleUpdateObject}
            onReplaceImage={handleReplaceObjectImage}
            canMoveUp={selectedObjectIndex > 0}
            canMoveDown={selectedObjectIndex < objects.length - 1}
          />
        </aside>
      )}
    </div>
  );
}

export default App;
