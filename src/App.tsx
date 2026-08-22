import { useState, useCallback, useEffect, useRef } from 'react';
import { CardGrid } from './components/CardGrid';
import { CardOptionsMenu } from './components/CardOptionsMenu';
import { generatePDF } from './utils/pdfGenerator';
import { generateId } from './utils/generateId';
import { cloneDndStats } from './utils/dndStats';
import { pluralRu } from './utils/pluralRu';
import type { CharacterCard, NameSettings, ImageFillMode, ImageFocus, DndStatsSettings } from './types';
import { DEFAULT_IMAGE_FOCUS } from './types';
import { applyReplacedImage, filesFromClipboard, ingestImageFiles, ingestReplacementAndExtras } from './utils/imageIngest';
import type { CardsPerPageOption } from './constants';
import './styles/cardVisuals.css';
import './App.css';

function App() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPageOption>(4);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const generatingLockRef = useRef(false);
  const cardsRef = useRef(cards);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (cards.length === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cards.length]);

  useEffect(() => {
    if (!selectedCardId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCardId(null);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.sidebar') || target.closest('.card') || target.closest('.side-preview-modal')) {
        return;
      }
      setSelectedCardId(null);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [selectedCardId]);

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
      void ingestImageFiles(files).then(({ cards: newCards, errors }) => {
        setIngestError(errors.length > 0 ? errors.join('\n') : null);
        if (newCards.length > 0) {
          setCards((prev) => [...prev, ...newCards]);
        }
      });
    };

    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

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

  const handleClearAll = useCallback(() => {
    if (
      !window.confirm('Удалить все карточки? Это действие нельзя отменить.')
    ) {
      return;
    }
    cardsRef.current.forEach((card) => URL.revokeObjectURL(card.imageUrl));
    setCards([]);
    setSelectedCardId(null);
  }, []);

  const handleGeneratePDF = useCallback(async () => {
    if (cards.length === 0 || generatingLockRef.current) return;
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
    setGeneratingProgress({ completed: 0, total: cards.length });
    try {
      const { url, filename } = await generatePDF(
        cards,
        cardsPerPage,
        (completed, total) => {
          setGeneratingProgress({ completed, total });
        }
      );
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
  }, [cards, cardsPerPage]);

  const pageCount = Math.ceil(cards.length / cardsPerPage);

  const selectedCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) : null;
  const selectedIndex = selectedCardId ? cards.findIndex((c) => c.id === selectedCardId) : -1;

  return (
    <div className={`app ${selectedCardId ? 'with-sidebar' : ''}`}>
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
              <span className="layout-label">Карточек на странице:</span>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${cardsPerPage === 4 ? 'active' : ''}`}
                  aria-pressed={cardsPerPage === 4}
                  onClick={() => setCardsPerPage(4)}
                >
                  4 карточки
                  <span className="toggle-hint">крупнее</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${cardsPerPage === 20 ? 'active' : ''}`}
                  aria-pressed={cardsPerPage === 20}
                  onClick={() => setCardsPerPage(20)}
                >
                  20 карточек
                  <span className="toggle-hint">мини</span>
                </button>
              </div>
            </div>
          </section>

          <section className={`preview-section ${cards.length === 0 ? 'is-empty' : ''}`}>
            {cards.length > 0 && (
              <div className="preview-header">
                <h2 className="preview-title">
                  Карточки
                  <span className="card-count">
                    {cards.length} {pluralRu(cards.length, 'изображение', 'изображения', 'изображений')} • {pageCount} {pluralRu(pageCount, 'страница', 'страницы', 'страниц')}
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
          </section>
        </main>

        <footer className="footer">
          <p>
            Горизонтальные складывающиеся карточки • {cardsPerPage} {pluralRu(cardsPerPage, 'карточка', 'карточки', 'карточек')} на лист A4 • сложите по вертикали и повесьте на ширму мастера
          </p>
        </footer>
      </div>

      {selectedCard && (
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
            onReplaceImage={handleReplaceCardFiles}
            canMoveUp={selectedIndex > 0}
            canMoveDown={selectedIndex < cards.length - 1}
          />
        </aside>
      )}
    </div>
  );
}

export default App;
