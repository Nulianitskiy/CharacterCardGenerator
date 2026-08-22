import jsPDF from 'jspdf';
import type { CharacterCard, ImageFillMode, ImageFocus, NameSettings, CardSide } from '../types';
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
import { ensureNameFontsLoaded, drawFittedName, getNameSizeScale } from './nameLabelRender';
import { getPresetOverlay } from './presetOverlays';
import { layoutImageFill } from './imageFillLayout';
import { get2dContext } from './canvas2d';
import { drawDndStatsPanel } from './dndStatsRender';
import { cloneDndStats } from './dndStats';
import { closePrintImage, loadPrintImage, type PrintImage } from './printImage';

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

type RasterFormat = 'PNG' | 'JPEG';

const rotatePortraitToHalf = (
  portraitCanvas: HTMLCanvasElement,
  widthPx: number,
  heightPx: number,
  isSideB: boolean
): HTMLCanvasElement => {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = widthPx;
  outputCanvas.height = heightPx;
  const outputCtx = get2dContext(outputCanvas);
  outputCtx.translate(widthPx / 2, heightPx / 2);
  outputCtx.rotate(isSideB ? Math.PI / 2 : -Math.PI / 2);
  outputCtx.drawImage(
    portraitCanvas,
    -portraitCanvas.width / 2,
    -portraitCanvas.height / 2,
    portraitCanvas.width,
    portraitCanvas.height
  );
  return outputCanvas;
};

const renderDndStatsHalfToDataUrl = (
  widthPx: number,
  heightPx: number,
  isSideB: boolean,
  card: CharacterCard
): { dataUrl: string; format: RasterFormat } => {
  const portraitWidth = heightPx;
  const portraitHeight = widthPx;
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = portraitWidth;
  portraitCanvas.height = portraitHeight;
  const portraitCtx = get2dContext(portraitCanvas);
  const stats = cloneDndStats(card.dndStats);
  drawDndStatsPanel(
    portraitCtx,
    portraitWidth,
    portraitHeight,
    stats,
    card.nameSettings.name,
    card.nameSettings.font
  );
  const outputCanvas = rotatePortraitToHalf(portraitCanvas, widthPx, heightPx, isSideB);
  return { dataUrl: outputCanvas.toDataURL('image/png'), format: 'PNG' };
};

const renderCardHalfToDataUrl = async (
  image: PrintImage,
  widthPx: number,
  heightPx: number,
  isSideB: boolean = false,
  fillMode: ImageFillMode = 'cover',
  nameSettings?: NameSettings,
  imageFocus?: ImageFocus
): Promise<{ dataUrl: string; format: RasterFormat }> => {
  const portraitWidth = heightPx;
  const portraitHeight = widthPx;
  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = portraitWidth;
  portraitCanvas.height = portraitHeight;
  const portraitCtx = get2dContext(portraitCanvas);

  if (fillMode !== 'cover') {
    portraitCtx.fillStyle = '#ffffff';
    portraitCtx.fillRect(0, 0, portraitWidth, portraitHeight);
  }

  const layout = layoutImageFill(
    fillMode,
    portraitWidth,
    portraitHeight,
    image.width,
    image.height,
    imageFocus
  );
  portraitCtx.drawImage(image, layout.left, layout.top, layout.width, layout.height);

  const side: CardSide = isSideB ? 'b' : 'a';
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
          getNameSizeScale(nameSettings.blockSize)
        );
      }
    }
  }

  const outputCanvas = rotatePortraitToHalf(portraitCanvas, widthPx, heightPx, isSideB);

  const usePng = Boolean(shouldShowName && nameSettings);
  if (usePng) {
    return { dataUrl: outputCanvas.toDataURL('image/png'), format: 'PNG' };
  }
  return { dataUrl: outputCanvas.toDataURL('image/jpeg', 0.94), format: 'JPEG' };
};

const drawFoldLine = (
  pdf: jsPDF,
  x: number,
  y: number,
  height: number
) => {
  pdf.setDrawColor(120, 100, 60);
  pdf.setLineWidth(FOLD_LINE_WIDTH_MM);
  pdf.setLineDashPattern([FOLD_LINE_DASH_MM, FOLD_LINE_DASH_MM], 0);
  pdf.line(x, y + 0.5, x, y + height - 0.5);
  pdf.setLineDashPattern([], 0);
};

const drawCutLines = (
  pdf: jsPDF,
  cardsOnPage: number,
  cardHeight: number,
  cardsPerPage: CardsPerPageOption
) => {
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);

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

export const generatePDF = async (
  cards: CharacterCard[],
  cardsPerPage: CardsPerPageOption = 4,
  onProgress?: (completed: number, total: number) => void
): Promise<{ url: string; filename: string; blob: Blob }> => {
  if (cards.length === 0) {
    throw new Error('No cards to generate');
  }

  await ensureNameFontsLoaded();

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardHeight = getCardHeight(cardsPerPage);
  const cardWidth = getCardWidth(cardsPerPage);
  const halfWidth = getHalfWidth(cardsPerPage);
  const halfHeight = getHalfHeight(cardsPerPage);

  const pxPerMm = 10;
  const halfGapMm = 1;
  const halfWidthPx = halfWidth * pxPerMm;
  const halfHeightPx = halfHeight * pxPerMm;

  const columnsPerPage = cardsPerPage === 20 ? 2 : 1;

  for (let i = 0; i < cards.length; i++) {
    const pageIndex = Math.floor(i / cardsPerPage);
    const positionOnPage = i % cardsPerPage;

    if (positionOnPage === 0 && pageIndex > 0) {
      pdf.addPage();
    }

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

    const fillMode = cards[i].imageFillMode ?? 'cover';
    const nameSettings = cards[i].nameSettings?.enabled
      ? cards[i].nameSettings
      : undefined;
    const stats = cards[i].dndStats;
    const printImage = await loadPrintImage(cards[i].imageUrl, halfHeightPx, halfWidthPx);

    try {
      const renderHalf = (isSideB: boolean) => {
        const side: CardSide = isSideB ? 'b' : 'a';
        if (stats?.enabled && stats.displaySide === side) {
          return Promise.resolve(
            renderDndStatsHalfToDataUrl(halfWidthPx, halfHeightPx, isSideB, cards[i])
          );
        }
        return renderCardHalfToDataUrl(
          printImage,
          halfWidthPx,
          halfHeightPx,
          isSideB,
          fillMode,
          nameSettings,
          cards[i].imageFocus
        );
      };
      const [sideA, sideB] = await Promise.all([renderHalf(false), renderHalf(true)]);

    let sideBX = x - halfGapMm / 2;
    let sideAX = x + halfWidth + halfGapMm / 2;
    let foldX = x + halfWidth;
    if (cardsPerPage === 20) {
      const col = positionOnPage % columnsPerPage;
      if (col === 0) {
        sideBX = x - halfGapMm;
        sideAX = x + halfWidth;
        foldX = x + halfWidth - halfGapMm / 2;
      } else {
        sideBX = x;
        sideAX = x + halfWidth + halfGapMm;
        foldX = x + halfWidth + halfGapMm / 2;
      }
    }

    pdf.addImage(sideB.dataUrl, sideB.format, sideBX, y, halfWidth, cardHeight);
    pdf.addImage(sideA.dataUrl, sideA.format, sideAX, y, halfWidth, cardHeight);

    drawFoldLine(pdf, foldX, y, cardHeight);
    onProgress?.(i + 1, cards.length);
    } finally {
      closePrintImage(printImage);
    }
  }

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
  pdf.setProperties({ title: filename });
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);

  return { url, filename, blob };
};
