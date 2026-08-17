import jsPDF from 'jspdf';
import type { CharacterCard, NameSettings, ImageFillMode } from '../types';
import {
  CUT_LINE_WIDTH_MM,
  FOLD_LINE_WIDTH_MM,
  FOLD_LINE_DASH_MM,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  getCardHeight,
  getCardWidth,
  getHalfWidth,
  getHalfHeight,
  type CardsPerPageOption,
} from '../constants';
import { ensureNameFontsLoaded, renderNameLabelToDataUrl, drawFittedName } from './nameLabelRender';
import { getPresetOverlay, isPresetBackground } from './presetOverlays';
import { layoutImageFill } from './imageFillLayout';

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

const overlayImageCache = new Map<string, HTMLImageElement>();

const loadOverlayImage = async (src: string): Promise<HTMLImageElement> => {
  const cached = overlayImageCache.get(src);
  if (cached) return cached;
  const img = await loadImage(src);
  overlayImageCache.set(src, img);
  return img;
};

const renderCardHalfToDataUrl = async (
  imageUrl: string,
  widthPx: number,
  heightPx: number,
  flipForGmSide: boolean = false,
  fillMode: ImageFillMode = 'cover',
  nameSettings?: NameSettings
): Promise<string> => {
  const img = await loadImage(imageUrl);
  const portraitWidth = heightPx;
  const portraitHeight = widthPx;
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = portraitWidth;
  portraitCanvas.height = portraitHeight;
  const portraitCtx = portraitCanvas.getContext('2d')!;

  if (fillMode !== 'cover') {
    portraitCtx.fillStyle = '#ffffff';
    portraitCtx.fillRect(0, 0, portraitWidth, portraitHeight);
  }

  const layout = layoutImageFill(
    fillMode,
    portraitWidth,
    portraitHeight,
    img.width,
    img.height
  );
  portraitCtx.drawImage(img, layout.left, layout.top, layout.width, layout.height);

  const side = flipForGmSide ? 'gm' : 'player';
  const shouldShowName =
    nameSettings?.enabled &&
    (nameSettings.displaySide === side || nameSettings.displaySide === 'both');

  if (shouldShowName && nameSettings) {
    const overlay = getPresetOverlay(nameSettings.background);
    if (overlay) {
      const frame = await loadOverlayImage(overlay.src);
      portraitCtx.drawImage(frame, 0, 0, portraitWidth, portraitHeight);
      if (nameSettings.name.trim()) {
        const nx = overlay.nameBox.x * portraitWidth;
        const ny = overlay.nameBox.y * portraitHeight;
        const nw = overlay.nameBox.w * portraitWidth;
        const nh = overlay.nameBox.h * portraitHeight;
        drawFittedName(
          portraitCtx,
          nameSettings.name,
          nameSettings.font,
          nx,
          ny,
          nw,
          nh,
          overlay.textColor,
          nameSettings.blockSize === 'small'
            ? 0.72
            : nameSettings.blockSize === 'medium'
              ? 0.86
              : 1
        );
      }
    }
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = widthPx;
  outputCanvas.height = heightPx;
  const outputCtx = outputCanvas.getContext('2d')!;
  outputCtx.translate(widthPx / 2, heightPx / 2);
  outputCtx.rotate(flipForGmSide ? Math.PI / 2 : -Math.PI / 2);
  outputCtx.drawImage(
    portraitCanvas,
    -portraitWidth / 2,
    -portraitHeight / 2,
    portraitWidth,
    portraitHeight
  );

  return outputCanvas.toDataURL('image/jpeg', 0.94);
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
  pdf.line(x, y + 0.5, x, y + height - 0.5);
  // Reset dash pattern
  pdf.setLineDashPattern([], 0);
};

/**
 * Get block height in mm based on size option
 */
const getBlockHeightMm = (size: NameSettings['blockSize']): number => {
  switch (size) {
    case 'small':
      return 7;
    case 'medium':
      return 10;
    case 'large':
      return 14;
    default:
      return 14;
  }
};

/**
 * Draws character name on a card half using canvas rendering
 * The name is rotated to match the card orientation
 */
const drawCharacterName = async (
  pdf: jsPDF,
  nameSettings: NameSettings,
  x: number,
  y: number,
  halfWidth: number,
  cardHeight: number,
  isGmSide: boolean,
  inset: number
) => {
  if (!nameSettings.enabled || !nameSettings.name.trim()) return;
  
  const shouldShow = 
    nameSettings.displaySide === 'both' ||
    (nameSettings.displaySide === 'player' && !isGmSide) ||
    (nameSettings.displaySide === 'gm' && isGmSide);
  
  if (!shouldShow) return;

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
  
  const labelDataUrl = await renderNameLabelToDataUrl(nameSettings, labelWidthPx, labelHeightPx, rotation);
  
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

  const mx = PAGE_MARGIN_X_MM;
  const my = PAGE_MARGIN_Y_MM;

  if (cardsPerPage === 20) {
    const cardWidth = getCardWidth(cardsPerPage);
    const rowsOnPage = Math.ceil(cardsOnPage / 2);
    const contentRight = mx + 2 * cardWidth;
    const contentBottom = my + rowsOnPage * cardHeight;

    pdf.line(mx + cardWidth, my, mx + cardWidth, contentBottom);

    for (let i = 1; i < rowsOnPage; i++) {
      const y = my + i * cardHeight;
      pdf.line(mx, y, contentRight, y);
    }
  } else {
    const cardWidth = getCardWidth(cardsPerPage);
    const contentRight = mx + cardWidth;

    for (let i = 1; i < cardsOnPage; i++) {
      const y = my + i * cardHeight;
      pdf.line(mx, y, contentRight, y);
    }
  }
};

/**
 * Generates a PDF document with all foldable character cards laid out horizontally
 * Each card has the image twice - rotated on left, normal on right
 * Cards use the area inside 0.5 cm margins on all sides; white cut lines run within that area
 * @param cards - Array of character cards to include
 * @param cardsPerPage - Number of cards per page (4 or 20)
 * @returns Object URL and filename for opening the PDF in a new tab
 */
export const generatePDF = async (
  cards: CharacterCard[],
  cardsPerPage: CardsPerPageOption = 4
): Promise<{ url: string; filename: string }> => {
  if (cards.length === 0) {
    throw new Error('No cards to generate');
  }

  await ensureNameFontsLoaded();

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
      const col = positionOnPage % columnsPerPage;
      const row = Math.floor(positionOnPage / columnsPerPage);
      x = PAGE_MARGIN_X_MM + col * cardWidth;
      y = PAGE_MARGIN_Y_MM + row * cardHeight;
    } else {
      x = PAGE_MARGIN_X_MM;
      y = PAGE_MARGIN_Y_MM + positionOnPage * cardHeight;
    }

    // Render both halves of the card
    const fillMode = cards[i].imageFillMode ?? 'cover';
    const presetNameSettings =
      cards[i].nameSettings?.enabled && isPresetBackground(cards[i].nameSettings.background)
        ? cards[i].nameSettings
        : undefined;
    const [normalDataUrl, rotatedDataUrl] = await Promise.all([
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, false, fillMode, presetNameSettings),
      renderCardHalfToDataUrl(cards[i].imageUrl, halfWidthPx, halfHeightPx, true, fillMode, presetNameSettings),
    ]);

    const card = cards[i];

    pdf.addImage(
      rotatedDataUrl,
      'JPEG',
      x,
      y,
      halfWidth,
      cardHeight
    );

    pdf.addImage(
      normalDataUrl,
      'JPEG',
      x + halfWidth,
      y,
      halfWidth,
      cardHeight
    );

    drawFoldLine(pdf, x + halfWidth, y, cardHeight);

    if (
      card.nameSettings?.enabled &&
      card.nameSettings.name.trim() &&
      !isPresetBackground(card.nameSettings.background)
    ) {
      await drawCharacterName(pdf, card.nameSettings, x, y, halfWidth, cardHeight, true, 0.25);
      await drawCharacterName(pdf, card.nameSettings, x + halfWidth, y, halfWidth, cardHeight, false, 0.25);
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

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `initiative-cards-${cardsPerPage}pp-${timestamp}.pdf`;
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);

  return { url, filename };
};
