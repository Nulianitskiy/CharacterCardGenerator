import { useState, useCallback } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { CardGrid } from './components/CardGrid';
import { CardOptionsMenu } from './components/CardOptionsMenu';
import { generatePDF } from './utils/pdfGenerator';
import type { CharacterCard, NameSettings } from './types';
import type { CardsPerPageOption } from './constants';
import './App.css';

function App() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPageOption>(5);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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

  const handleClearAll = useCallback(() => {
    // Revoke all object URLs to free memory
    cards.forEach((card) => URL.revokeObjectURL(card.imageUrl));
    setCards([]);
  }, [cards]);

  const handleGeneratePDF = useCallback(async () => {
    if (cards.length === 0) return;

    setIsGenerating(true);
    try {
      await generatePDF(cards, cardsPerPage);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
          <h1 className="title">Initiative Card Generator</h1>
          <p className="subtitle">
            Create foldable initiative cards that hang on your GM screen
          </p>
        </header>

        <main className="main">
          <section className="upload-section">
            <ImageUpload onImagesUploaded={handleImagesUploaded} />
          </section>

          <section className="layout-section">
            <div className="layout-toggle">
              <span className="layout-label">Cards per page:</span>
              <div className="toggle-buttons">
                <button
                  className={`toggle-btn ${cardsPerPage === 4 ? 'active' : ''}`}
                  onClick={() => setCardsPerPage(4)}
                >
                  4 cards
                  <span className="toggle-hint">larger</span>
                </button>
                <button
                  className={`toggle-btn ${cardsPerPage === 5 ? 'active' : ''}`}
                  onClick={() => setCardsPerPage(5)}
                >
                  5 cards
                  <span className="toggle-hint">compact</span>
                </button>
              </div>
            </div>
          </section>

          <section className="preview-section">
            <div className="preview-header">
              <h2 className="preview-title">
                Cards
                {cards.length > 0 && (
                  <span className="card-count">
                    {cards.length} image{cards.length !== 1 ? 's' : ''} • {pageCount} page
                    {pageCount !== 1 ? 's' : ''}
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
                    Clear All
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner" />
                        Generating...
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
                        Generate PDF
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
            Horizontal foldable cards • {cardsPerPage} cards per A4 page • Fold
            vertically to hang on GM screen
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
            canMoveUp={selectedIndex > 0}
            canMoveDown={selectedIndex < cards.length - 1}
          />
        </aside>
      )}
    </div>
  );
}

export default App;
