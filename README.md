# Initiative Card Generator

A web application for creating printable foldable initiative cards, tabletop pawns, and two-sided object cards for tabletop RPGs. Upload character portraits and generate PDF cards that hang on a GM screen.

## Features

- **Upload** — drag-and-drop, file picker, or paste (Ctrl+V). JPG, PNG, WEBP, and HEIC (if the browser can decode it)
- **Layouts** — 4 large cards, 20 mini pawns, or 4 object-card pairs per A4 page
- **Grid preview** — hanging portrait faces (side A), not a full A4 sheet
- **Name plates** — decorative frames and labels on side A, side B, or both
- **D&D face** — optional stat block on one side instead of a portrait
- **Foldable design** — cards fold vertically and hang on GM screens
- **Object cards** — physical item cards: a shirt (image, name, slogan scroll, quantity badge) printed next to its framed description; cut out the pair and glue it into a two-sided card
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
3. Select the mode: 4 large cards, 20 compact pawns, or object cards (up to 4 pairs per page)
4. Click a card to set a name, frame, fill mode, crop, D&D stats, and order. Drag cards in the grid to reorder; drop a file on a card to replace its portrait. For objects set the name, slogan, description, quantity badge and a color theme
5. Click "Создать PDF" to open a printable PDF in a tab
6. Print the PDF and cut along the white lines between cards
7. Fold each card vertically along the dashed line
8. Hang the folded cards on your GM screen. For object cards, cut out each shirt+description pair and glue the two faces together

The interface is in Russian.

## Tech Stack

- React 19
- TypeScript
- Vite
- jsPDF for PDF generation
- Vitest

## License

MIT
