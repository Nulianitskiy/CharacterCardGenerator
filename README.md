# Initiative Card Generator

A web application for creating printable foldable initiative cards for tabletop RPGs. Upload character images and generate PDF cards ready for printing that hang on your GM screen.

## Features

- **Drag & Drop Upload** - Easy image upload with drag-and-drop or file browser
- **Multiple Layouts** - Choose between 4 or 5 cards per A4 page
- **Foldable Design** - Cards are designed to fold vertically and hang on GM screens
- **Decorative Borders** - Gold-accented borders with fold lines
- **PDF Generation** - One-click PDF export for printing
- **Responsive UI** - Works on desktop and mobile devices

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

## Usage

1. Open the application in your browser
2. Upload character images (JPG, PNG, or WEBP)
3. Select the number of cards per page (4 for larger cards, 5 for compact)
4. Click "Generate PDF" to download the printable PDF
5. Print the PDF and cut along the white lines between cards
6. Fold each card vertically along the dashed line
7. Hang the folded cards on your GM screen

## Tech Stack

- React 19
- TypeScript
- Vite
- jsPDF for PDF generation

## License

MIT
