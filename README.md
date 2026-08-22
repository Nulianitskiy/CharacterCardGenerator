# Initiative Card Generator

A web application for creating printable foldable initiative cards for tabletop RPGs. Upload character portraits and generate PDF cards that hang on a GM screen.

## Features

- **Upload** — drag-and-drop, file picker, or paste (Ctrl+V). JPG, PNG, WEBP, and HEIC (if the browser can decode it)
- **Layouts** — 4 large cards or 20 mini cards per A4 page
- **Grid preview** — hanging portrait faces (side A), not a full A4 sheet
- **Name plates** — decorative frames and labels on side A, side B, or both
- **D&D face** — optional stat block on one side instead of a portrait
- **Foldable design** — cards fold vertically and hang on GM screens
- **PDF export** — opens in one preview tab (download only if the browser blocks pop-ups)

## Demo

The application is deployed at: https://nulianitskiy.github.io/CharacterCardGenerator/

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nulianitskiy/CharacterCardGenerator.git
cd CharacterCardGenerator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Tests

```bash
npm test
```

## Usage

1. Open the application in your browser
2. Upload character images (JPG, PNG, WEBP, or HEIC)
3. Select the number of cards per page (4 for larger cards, 20 for compact)
4. Click a card to set a name, frame, fill mode, crop, D&D stats, and order. Drag cards in the grid to reorder; drop a file on a card to replace its portrait
5. Click "Создать PDF" to open a printable PDF in a tab
6. Print the PDF and cut along the white lines between cards
7. Fold each card vertically along the dashed line
8. Hang the folded cards on your GM screen

The interface is in Russian.

## Tech Stack

- React 19
- TypeScript
- Vite
- jsPDF for PDF generation
- Vitest

## License

MIT
