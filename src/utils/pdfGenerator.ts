import jsPDF from 'jspdf';
import type { CharacterCard } from '../types';
import {
  CARD_WIDTH_MM,
  HALF_WIDTH_MM,
  A4_WIDTH_MM,
  BORDER_WIDTH_MM,
  CUT_LINE_WIDTH_MM,
  FOLD_LINE_WIDTH_MM,
  FOLD_LINE_DASH_MM,
  getCardHeight,
  getHalfHeight,
  type CardsPerPageOption,
} from '../constants';

/**
 * Loads an image from a URL and returns it as an HTMLImageElement
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Renders a single card half (one image) to a canvas with cover crop and rotation
 * Images are rotated 90° to fit the horizontal card layout
 * @param imageUrl - URL of the image to render
 * @param widthPx - Target width in pixels
 * @param heightPx - Target height in pixels
 * @param flipForGmSide - If true, rotates +90° (GM side), otherwise -90° (player side)
 * Returns the canvas data URL for embedding in PDF
 */
const renderCardHalfToDataUrl = async (
  imageUrl: string,
  widthPx: number,
  heightPx: number,
  flipForGmSide: boolean = false
): Promise<string> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  // For cover crop with rotation, we need to think of the image as rotated
  // The target area is widthPx x heightPx, but the image will be drawn rotated
  // So we calculate crop based on the rotated dimensions
  const imgAspect = img.width / img.height;
  // After 90° rotation, the target aspect ratio is inverted for cropping calculation
  const targetAspect = heightPx / widthPx;

  let srcX = 0;
  let srcY = 0;
  let srcWidth = img.width;
  let srcHeight = img.height;

  if (imgAspect > targetAspect) {
    // Image is wider - crop sides
    srcWidth = img.height * targetAspect;
    srcX = (img.width - srcWidth) / 2;
  } else {
    // Image is taller - crop top/bottom
    srcHeight = img.width / targetAspect;
    srcY = (img.height - srcHeight) / 2;
  }

  // Apply rotation: -90° for player side (right), +90° for GM side (left)
  ctx.translate(widthPx / 2, heightPx / 2);
  if (flipForGmSide) {
    ctx.rotate(Math.PI / 2); // +90 degrees (GM/left side)
  } else {
    ctx.rotate(-Math.PI / 2); // -90 degrees (player/right side)
  }
  // After rotation, we draw centered at origin with swapped dimensions
  ctx.drawImage(
    img,
    srcX, srcY, srcWidth, srcHeight,
    -heightPx / 2, -widthPx / 2, heightPx, widthPx
  );

  return canvas.toDataURL('image/jpeg', 0.92);
};

/**
 * Draws a decorative card border onto the PDF
 */
const drawCardBorder = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const borderWidth = BORDER_WIDTH_MM;
  const cornerRadius = 2;

  // Outer border - dark gold
  pdf.setDrawColor(100, 80, 45);
  pdf.setLineWidth(borderWidth);
  pdf.roundedRect(
    x + borderWidth / 2,
    y + borderWidth / 2,
    width - borderWidth,
    height - borderWidth,
    cornerRadius,
    cornerRadius
  );

  // Inner accent line - lighter gold
  pdf.setDrawColor(180, 150, 90);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(
    x + borderWidth + 0.6,
    y + borderWidth + 0.6,
    width - (borderWidth + 0.6) * 2,
    height - (borderWidth + 0.6) * 2,
    cornerRadius - 0.3,
    cornerRadius - 0.3
  );
};

/**
 * Draws a dashed vertical fold line in the middle of the horizontal card
 */
const drawFoldLine = (
  pdf: jsPDF,
  x: number,
  y: number,
  height: number
) => {
  pdf.setDrawColor(120, 100, 60);
  pdf.setLineWidth(FOLD_LINE_WIDTH_MM);
  pdf.setLineDashPattern([FOLD_LINE_DASH_MM, FOLD_LINE_DASH_MM], 0);
  // Vertical line in the center
  pdf.line(x, y + BORDER_WIDTH_MM + 0.5, x, y + height - BORDER_WIDTH_MM - 0.5);
  // Reset dash pattern
  pdf.setLineDashPattern([], 0);
};

/**
 * Draws white cut lines between cards for easy cutting
 */
const drawCutLines = (
  pdf: jsPDF,
  cardsOnPage: number,
  cardHeight: number
) => {
  pdf.setDrawColor(255, 255, 255); // White
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0); // Solid line

  // Draw horizontal cut lines between cards
  for (let i = 1; i < cardsOnPage; i++) {
    const y = i * cardHeight;
    pdf.line(0, y, A4_WIDTH_MM, y);
  }
};

/**
 * Generates a PDF document with all foldable character cards laid out horizontally
 * Each card has the image twice - rotated on left, normal on right
 * Cards fill the entire A4 page with white cut lines between them
 * @param cards - Array of character cards to include
 * @param cardsPerPage - Number of cards per page (4 or 5)
 */
export const generatePDF = async (
  cards: CharacterCard[],
  cardsPerPage: CardsPerPageOption = 5
): Promise<void> => {
  if (cards.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Get dimensions based on cards per page
  const cardHeight = getCardHeight(cardsPerPage);
  const halfHeight = getHalfHeight(cardsPerPage);

  // High-resolution rendering (300 DPI equivalent)
  const pxPerMm = 10;
  const halfWidthPx = HALF_WIDTH_MM * pxPerMm;
  const halfHeightPx = halfHeight * pxPerMm;

  for (let i = 0; i < cards.length; i++) {
    const pageIndex = Math.floor(i / cardsPerPage);
    const positionOnPage = i % cardsPerPage;

    // Add new page if needed (skip for first page)
    if (positionOnPage === 0 && pageIndex > 0) {
      pdf.addPage();
    }

    // Calculate card position (no margins, cards fill entire page)
    const x = 0;
    const y = positionOnPage * cardHeight;

    // Render both halves of the card
    const [normalDataUrl, rotatedDataUrl] = await Promise.all([
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, false),
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, true),
    ]);

    // Inset for border
    const inset = BORDER_WIDTH_MM + 0.5;
    // Gap between the two halves (for fold line)
    const halfGap = 0.8;

    // Add left half (rotated - GM side when folded)
    pdf.addImage(
      rotatedDataUrl,
      'JPEG',
      x + inset,
      y + inset,
      HALF_WIDTH_MM - inset - halfGap,
      cardHeight - inset * 2
    );

    // Add right half (normal - player side)
    pdf.addImage(
      normalDataUrl,
      'JPEG',
      x + HALF_WIDTH_MM + halfGap,
      y + inset,
      HALF_WIDTH_MM - inset - halfGap,
      cardHeight - inset * 2
    );

    // Draw decorative border around entire card
    drawCardBorder(pdf, x, y, CARD_WIDTH_MM, cardHeight);

    // Draw vertical fold line in the middle
    drawFoldLine(pdf, x + HALF_WIDTH_MM, y, cardHeight);
  }

  // Draw cut lines on each page
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  for (let page = 0; page < totalPages; page++) {
    pdf.setPage(page + 1);
    const cardsOnThisPage = Math.min(
      cardsPerPage,
      cards.length - page * cardsPerPage
    );
    drawCutLines(pdf, cardsOnThisPage, cardHeight);
  }

  // Save the PDF with a timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  pdf.save(`initiative-cards-${cardsPerPage}pp-${timestamp}.pdf`);
};
