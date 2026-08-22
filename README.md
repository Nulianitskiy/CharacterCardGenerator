# Initiative Card Generator

A web application for creating printable foldable initiative cards for tabletop RPGs. Upload character images and generate PDF cards ready for printing that hang on your GM screen.

## Features

- **Drag & Drop Upload** - Image upload with drag-and-drop or file browser (JPG, PNG, WEBP)
- **Multiple Layouts** - 4 large cards or 20 mini cards per A4 page
- **Print preview** - On-screen A4 sheets with fold lines matching the PDF
- **Name plates** - Decorative frames and labels on side A, side B, or both
- **Foldable Design** - Cards fold vertically and hang on GM screens
- **PDF Export** - Named PDF download plus a preview tab

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
2. Upload character images (JPG, PNG, or WEBP)
3. Select the number of cards per page (4 for larger cards, 20 for compact)
4. Click a card to set a name, frame, fill mode, and order
5. Click "Создать PDF" to download a printable PDF and open a preview
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
