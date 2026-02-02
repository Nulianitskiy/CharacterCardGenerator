import jsPDF from 'jspdf';
import type { CharacterCard, NameSettings, NameBackgroundType, FontOption, BlockSizeOption } from '../types';
import {
  A4_WIDTH_MM,
  BORDER_WIDTH_MM,
  CUT_LINE_WIDTH_MM,
  FOLD_LINE_WIDTH_MM,
  FOLD_LINE_DASH_MM,
  getCardHeight,
  getCardWidth,
  getHalfWidth,
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
 * Get CSS font string based on font option (for canvas context)
 */
const getCanvasFont = (font: FontOption, sizePx: number): string => {
  switch (font) {
    case 'medieval':
      return `bold ${sizePx}px "Times New Roman", serif`;
    case 'elegant':
      return `italic ${sizePx}px Georgia, serif`;
    case 'fantasy':
      return `${sizePx}px Papyrus, Copperplate, fantasy`;
    default:
      return `bold ${sizePx}px "Times New Roman", serif`;
  }
};

/**
 * Get block height in mm based on size option
 */
const getBlockHeightMm = (size: BlockSizeOption): number => {
  switch (size) {
    case 'small':
      return 7;
    case 'medium':
      return 10;
    case 'large':
      return 14;
    default:
      return 10;
  }
};

/**
 * Background configuration for gradient rendering
 * Gradients go from bottom (opaque) to top (transparent) like in CSS preview
 */
interface BackgroundConfig {
  gradientStops: { offset: number; color: string }[];
  textColor: string;
  borderColor?: string;
  isPreset?: boolean; // If true, draw full border around block
}

/**
 * Get background configuration with gradient stops
 * Matches CSS: linear-gradient(to top, solid 0%, faded 60%, transparent 100%)
 */
const getBackgroundConfig = (bg: NameBackgroundType): BackgroundConfig => {
  switch (bg) {
    case 'gradient-dark':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(0, 0, 0, 0.9)' },
          { offset: 0.6, color: 'rgba(0, 0, 0, 0.6)' },
          { offset: 1, color: 'rgba(0, 0, 0, 0)' },
        ],
        textColor: '#ffffff',
      };
    case 'gradient-gold':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(139, 109, 56, 0.95)' },
          { offset: 0.6, color: 'rgba(139, 109, 56, 0.6)' },
          { offset: 1, color: 'rgba(139, 109, 56, 0)' },
        ],
        textColor: '#ffffff',
      };
    case 'gradient-red':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(120, 40, 40, 0.95)' },
          { offset: 0.6, color: 'rgba(120, 40, 40, 0.6)' },
          { offset: 1, color: 'rgba(120, 40, 40, 0)' },
        ],
        textColor: '#ffffff',
      };
    case 'scroll':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(45, 40, 35, 0.95)' },
          { offset: 1, color: 'rgba(45, 40, 35, 0.95)' },
        ],
        textColor: '#f5f0e6',
        borderColor: 'rgba(160, 135, 85, 0.8)',
        isPreset: true,
      };
    case 'banner':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(70, 25, 25, 0.95)' },
          { offset: 1, color: 'rgba(70, 25, 25, 0.95)' },
        ],
        textColor: '#f5f0e6',
        borderColor: 'rgba(180, 130, 100, 0.8)',
        isPreset: true,
      };
    case 'shield':
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(25, 40, 60, 0.95)' },
          { offset: 1, color: 'rgba(25, 40, 60, 0.95)' },
        ],
        textColor: '#f5f0e6',
        borderColor: 'rgba(120, 150, 180, 0.8)',
        isPreset: true,
      };
    default:
      return {
        gradientStops: [
          { offset: 0, color: 'rgba(0, 0, 0, 0.9)' },
          { offset: 0.6, color: 'rgba(0, 0, 0, 0.6)' },
          { offset: 1, color: 'rgba(0, 0, 0, 0)' },
        ],
        textColor: '#ffffff',
      };
  }
};

/**
 * Wrap text to fit within a given width
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

/**
 * Renders character name label to a canvas data URL
 * Uses canvas to support Cyrillic and other Unicode characters
 * Supports multi-line text wrapping and gradient backgrounds
 */
const renderNameLabelToDataUrl = (
  nameSettings: NameSettings,
  widthPx: number,
  heightPx: number,
  rotationDeg: number = 0
): string => {
  const canvas = document.createElement('canvas');
  
  // If rotated, swap dimensions for the canvas
  if (Math.abs(rotationDeg) === 90) {
    canvas.width = heightPx;
    canvas.height = widthPx;
  } else {
    canvas.width = widthPx;
    canvas.height = heightPx;
  }
  
  const ctx = canvas.getContext('2d')!;
  
  // Apply rotation
  if (rotationDeg !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.translate(-widthPx / 2, -heightPx / 2);
  }
  
  const config = getBackgroundConfig(nameSettings.background);
  
  // Draw gradient background - vertical from bottom (opaque) to top (transparent)
  // In canvas: y=heightPx is bottom, y=0 is top
  const gradient = ctx.createLinearGradient(0, heightPx, 0, 0);
  for (const stop of config.gradientStops) {
    gradient.addColorStop(stop.offset, stop.color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, widthPx, heightPx);
  
  // Draw border
  if (config.borderColor) {
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 3;
    
    if (config.isPreset) {
      // Full border for presets
      const borderInset = 1.5;
      ctx.strokeRect(borderInset, borderInset, widthPx - borderInset * 2, heightPx - borderInset * 2);
    } else {
      // Top border only for gradients
      ctx.beginPath();
      ctx.moveTo(0, 1.5);
      ctx.lineTo(widthPx, 1.5);
      ctx.stroke();
    }
  }
  
  // Calculate font size based on block height, start large and scale down if needed
  const padding = 16;
  const maxWidth = widthPx - padding * 2;
  const maxHeight = heightPx - padding;
  const lineHeightMultiplier = 1.15;
  
  // Start with a font size proportional to height
  let fontSize = Math.floor(heightPx * 0.45);
  const minFontSize = 14;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = config.textColor;
  
  let lines: string[] = [];
  let totalTextHeight = 0;
  
  // Scale down font size until text fits
  while (fontSize >= minFontSize) {
    ctx.font = getCanvasFont(nameSettings.font, fontSize);
    lines = wrapText(ctx, nameSettings.name, maxWidth);
    const lineHeight = fontSize * lineHeightMultiplier;
    totalTextHeight = lines.length * lineHeight;
    
    if (totalTextHeight <= maxHeight) {
      break;
    }
    fontSize -= 2;
  }
  
  // Draw the text lines
  const lineHeight = fontSize * lineHeightMultiplier;
  const startY = (heightPx - totalTextHeight) / 2 + lineHeight / 2;
  
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], widthPx / 2, startY + i * lineHeight);
  }
  
  return canvas.toDataURL('image/png');
};

/**
 * Draws character name on a card half using canvas rendering
 * The name is rotated to match the card orientation
 */
const drawCharacterName = (
  pdf: jsPDF,
  nameSettings: NameSettings,
  x: number,
  y: number,
  halfWidth: number,
  cardHeight: number,
  isGmSide: boolean
) => {
  if (!nameSettings.enabled || !nameSettings.name.trim()) return;
  
  const shouldShow = 
    nameSettings.displaySide === 'both' ||
    (nameSettings.displaySide === 'player' && !isGmSide) ||
    (nameSettings.displaySide === 'gm' && isGmSide);
  
  if (!shouldShow) return;

  const inset = BORDER_WIDTH_MM + 0.5;
  
  // Block height based on size setting
  const nameHeight = getBlockHeightMm(nameSettings.blockSize);
  
  // For rotated cards, the name label width becomes the card height
  // and the height becomes a strip along the edge
  const pxPerMm = 10;
  const labelWidthMm = cardHeight - inset * 2;
  const labelHeightMm = nameHeight;
  
  const labelWidthPx = labelWidthMm * pxPerMm;
  const labelHeightPx = labelHeightMm * pxPerMm;
  
  // Rotation: GM side (left) is rotated +90°, player side (right) is rotated -90°
  const rotation = isGmSide ? 90 : -90;
  
  // Render the name label
  const labelDataUrl = renderNameLabelToDataUrl(nameSettings, labelWidthPx, labelHeightPx, rotation);
  
  // Position the label
  // For GM side (left half): label goes on the left edge (after rotation, it's at x position)
  // For player side (right half): label goes on the right edge
  let labelX: number;
  const labelY = y + inset;
  
  if (isGmSide) {
    // Left edge of left half
    labelX = x + inset;
  } else {
    // Right edge of right half
    labelX = x + halfWidth - inset - nameHeight;
  }
  
  // Add the rotated label image
  // After rotation, dimensions are swapped
  pdf.addImage(
    labelDataUrl,
    'PNG',
    labelX,
    labelY,
    nameHeight, // width after rotation
    labelWidthMm // height after rotation
  );
};

/**
 * Draws white cut lines between cards for easy cutting
 */
const drawCutLines = (
  pdf: jsPDF,
  cardsOnPage: number,
  cardHeight: number,
  cardsPerPage: CardsPerPageOption
) => {
  pdf.setDrawColor(255, 255, 255); // White
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0); // Solid line

  if (cardsPerPage === 20) {
    // For 20-card layout: 2 columns × 10 rows
    const cardWidth = getCardWidth(cardsPerPage);
    const rowsOnPage = Math.ceil(cardsOnPage / 2);
    
    // Draw vertical cut line between columns
    pdf.line(cardWidth, 0, cardWidth, rowsOnPage * cardHeight);
    
    // Draw horizontal cut lines between rows
    for (let i = 1; i < rowsOnPage; i++) {
      const y = i * cardHeight;
      pdf.line(0, y, A4_WIDTH_MM, y);
    }
  } else {
    // Draw horizontal cut lines between cards
    for (let i = 1; i < cardsOnPage; i++) {
      const y = i * cardHeight;
      pdf.line(0, y, A4_WIDTH_MM, y);
    }
  }
};

/**
 * Generates a PDF document with all foldable character cards laid out horizontally
 * Each card has the image twice - rotated on left, normal on right
 * Cards fill the entire A4 page with white cut lines between them
 * @param cards - Array of character cards to include
 * @param cardsPerPage - Number of cards per page (4, 5, or 10)
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
  const cardWidth = getCardWidth(cardsPerPage);
  const halfWidth = getHalfWidth(cardsPerPage);
  const halfHeight = getHalfHeight(cardsPerPage);

  // High-resolution rendering (300 DPI equivalent)
  const pxPerMm = 10;
  const halfWidthPx = halfWidth * pxPerMm;
  const halfHeightPx = halfHeight * pxPerMm;

  // For 20-card layout: 2 columns × 10 rows
  const columnsPerPage = cardsPerPage === 20 ? 2 : 1;
  const rowsPerPage = cardsPerPage === 20 ? 10 : cardsPerPage;

  for (let i = 0; i < cards.length; i++) {
    const pageIndex = Math.floor(i / cardsPerPage);
    const positionOnPage = i % cardsPerPage;

    // Add new page if needed (skip for first page)
    if (positionOnPage === 0 && pageIndex > 0) {
      pdf.addPage();
    }

    // Calculate card position
    let x: number;
    let y: number;
    
    if (cardsPerPage === 20) {
      // 2 columns × 10 rows layout
      const col = positionOnPage % columnsPerPage;
      const row = Math.floor(positionOnPage / columnsPerPage);
      x = col * cardWidth;
      y = row * cardHeight;
    } else {
      // Single column layout
      x = 0;
      y = positionOnPage * cardHeight;
    }

    // Render both halves of the card
    const [normalDataUrl, rotatedDataUrl] = await Promise.all([
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, false),
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, true),
    ]);

    // Inset for border (scaled for smaller cards)
    const inset = cardsPerPage === 20 ? BORDER_WIDTH_MM * 0.6 + 0.3 : BORDER_WIDTH_MM + 0.5;
    // Gap between the two halves (for fold line)
    const halfGap = cardsPerPage === 20 ? 0.4 : 0.8;

    // Add left half (rotated - GM side when folded)
    pdf.addImage(
      rotatedDataUrl,
      'JPEG',
      x + inset,
      y + inset,
      halfWidth - inset - halfGap,
      cardHeight - inset * 2
    );

    // Add right half (normal - player side)
    pdf.addImage(
      normalDataUrl,
      'JPEG',
      x + halfWidth + halfGap,
      y + inset,
      halfWidth - inset - halfGap,
      cardHeight - inset * 2
    );

    // Draw decorative border around entire card
    drawCardBorder(pdf, x, y, cardWidth, cardHeight);

    // Draw vertical fold line in the middle
    drawFoldLine(pdf, x + halfWidth, y, cardHeight);

    // Draw character name if enabled
    const card = cards[i];
    if (card.nameSettings?.enabled && card.nameSettings.name.trim()) {
      // Draw on GM side (left half)
      drawCharacterName(pdf, card.nameSettings, x, y, halfWidth, cardHeight, true);
      // Draw on player side (right half)
      drawCharacterName(pdf, card.nameSettings, x + halfWidth, y, halfWidth, cardHeight, false);
    }
  }

  // Draw cut lines on each page
  const totalPages = Math.ceil(cards.length / cardsPerPage);
  for (let page = 0; page < totalPages; page++) {
    pdf.setPage(page + 1);
    const cardsOnThisPage = Math.min(
      cardsPerPage,
      cards.length - page * cardsPerPage
    );
    drawCutLines(pdf, cardsOnThisPage, cardHeight, cardsPerPage);
  }

  // Save the PDF with a timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  pdf.save(`initiative-cards-${cardsPerPage}pp-${timestamp}.pdf`);
};
