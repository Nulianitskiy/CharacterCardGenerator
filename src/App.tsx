import { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { CardGrid } from './components/CardGrid';
import { CardOptionsMenu } from './components/CardOptionsMenu';
import { generatePDF } from './utils/pdfGenerator';
import { generateId } from './utils/generateId';
import { pluralRu } from './utils/pluralRu';
import type { CharacterCard, NameSettings, ImageFillMode } from './types';
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
  const pdfUrlRef = useRef<string | null>(null);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

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
      if (target.closest('.sidebar') || target.closest('.card')) return;
      setSelectedCardId(null);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [selectedCardId]);

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
    if (cards.length === 0) return;

    const previewTab = window.open('', '_blank');
    if (previewTab) {
      previewTab.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Создание PDF…</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1a1612;
        color: #cdad6d;
        font-family: Georgia, serif;
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

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (previewTab && !previewTab.closed) {
        previewTab.location.replace(url);
        previewTab.focus();
      } else if (!window.open(url, '_blank')) {
        alert('Разрешите всплывающие окна, чтобы открыть PDF. Файл также скачан.');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      alert('Не удалось создать PDF. Попробуйте ещё раз.');
    } finally {
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
          <section className="upload-section">
            <ImageUpload onImagesUploaded={handleImagesUploaded} />
          </section>

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

          <section className="preview-section">
            <div className="preview-header">
              <h2 className="preview-title">
                Карточки
                {cards.length > 0 && (
                  <span className="card-count">
                    {cards.length} {pluralRu(cards.length, 'изображение', 'изображения', 'изображений')} • {pageCount} {pluralRu(pageCount, 'страница', 'страницы', 'страниц')}
                  </span>
                )}
              </h2>
              {cards.length > 0 && (
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
              )}
            </div>
            <CardGrid
              cards={cards}
              cardsPerPage={cardsPerPage}
              onRemoveCard={handleRemoveCard}
              onSelectCard={handleSelectCard}
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
            card={selectedCard}
            cardsPerPage={cardsPerPage}
            onClose={handleCloseOptions}
            onRemove={handleRemoveCard}
            onDuplicate={handleDuplicateCard}
            onMoveUp={handleMoveCardUp}
            onMoveDown={handleMoveCardDown}
            onUpdateNameSettings={handleUpdateNameSettings}
            onUpdateImageFillMode={handleUpdateImageFillMode}
            canMoveUp={selectedIndex > 0}
            canMoveDown={selectedIndex < cards.length - 1}
          />
        </aside>
      )}
    </div>
  );
}

export default App;
