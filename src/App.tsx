import { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { CardGrid } from './components/CardGrid';
import { CardOptionsMenu } from './components/CardOptionsMenu';
import { generatePDF } from './utils/pdfGenerator';
import type { CharacterCard, NameSettings, ImageFillMode } from './types';
import type { CardsPerPageOption } from './constants';
import './App.css';

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function App() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPageOption>(4);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  const handleImagesUploaded = useCallback((newCards: CharacterCard[]) => {
    setCards((prev) => [...prev, ...newCards]);
  }, []);

  const handleRemoveCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    setSelectedCardId((prevSelected) => (prevSelected === id ? null : prevSelected));
  }, []);

  const handleSelectCard = useCallback((id: string) => {
    setSelectedCardId((prev) => (prev === id ? null : id));
  }, []);

  const handleCloseOptions = useCallback(() => {
    setSelectedCardId(null);
  }, []);

  const handleDuplicateCard = useCallback((id: string) => {
    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index === -1) return prev;

      const cardToDuplicate = prev[index];
      const duplicatedCard: CharacterCard = {
        ...cardToDuplicate,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nameSettings: { ...cardToDuplicate.nameSettings },
        imageFillMode: cardToDuplicate.imageFillMode ?? 'cover',
      };

      const newCards = [...prev];
      newCards.splice(index + 1, 0, duplicatedCard);
      return newCards;
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

  const handlePlayerSideClick = useCallback((id: string) => {
    // TODO: Implement player side image selection
    console.log('Player side clicked for card:', id);
  }, []);

  const handleGmSideClick = useCallback((id: string) => {
    // TODO: Implement GM side image selection
    console.log('GM side clicked for card:', id);
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
    // Revoke all object URLs to free memory
    cards.forEach((card) => URL.revokeObjectURL(card.imageUrl));
    setCards([]);
  }, [cards]);

  const handleGeneratePDF = useCallback(async () => {
    if (cards.length === 0) return;

    // Open the tab immediately so the browser does not block the popup after await
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
    try {
      const { url } = await generatePDF(cards, cardsPerPage);
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = url;
      if (previewTab && !previewTab.closed) {
        previewTab.location.replace(url);
        previewTab.focus();
      } else if (!window.open(url, '_blank')) {
        alert('Разрешите всплывающие окна, чтобы открыть PDF');
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (previewTab && !previewTab.closed) {
        previewTab.close();
      }
      alert('Не удалось создать PDF. Попробуйте ещё раз.');
    } finally {
      setIsGenerating(false);
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
                  className={`toggle-btn ${cardsPerPage === 4 ? 'active' : ''}`}
                  onClick={() => setCardsPerPage(4)}
                >
                  4 карточки
                  <span className="toggle-hint">крупнее</span>
                </button>
                <button
                  className={`toggle-btn ${cardsPerPage === 20 ? 'active' : ''}`}
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
                    className="btn btn-secondary"
                    onClick={handleClearAll}
                    disabled={isGenerating}
                  >
                    Очистить все
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <svg
                          className="btn-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
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
            onClose={handleCloseOptions}
            onRemove={handleRemoveCard}
            onDuplicate={handleDuplicateCard}
            onMoveUp={handleMoveCardUp}
            onMoveDown={handleMoveCardDown}
            onPlayerSideClick={handlePlayerSideClick}
            onGmSideClick={handleGmSideClick}
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
