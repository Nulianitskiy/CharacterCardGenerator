import { useState, useCallback } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { CardGrid } from './components/CardGrid';
import { generatePDF } from './utils/pdfGenerator';
import type { CharacterCard } from './types';
import type { CardsPerPageOption } from './constants';
import './App.css';

function App() {
  const [cards, setCards] = useState<CharacterCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<CardsPerPageOption>(5);

  const handleImagesUploaded = useCallback((newCards: CharacterCard[]) => {
    setCards((prev) => [...prev, ...newCards]);
  }, []);

  const handleRemoveCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
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

  return (
    <div className="app">
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

        {/* Layout toggle */}
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
          <CardGrid cards={cards} onRemoveCard={handleRemoveCard} />
        </section>
      </main>

      <footer className="footer">
        <p>
          Horizontal foldable cards • {cardsPerPage} cards per A4 page • Fold
          vertically to hang on GM screen
        </p>
      </footer>
    </div>
  );
}

export default App;
