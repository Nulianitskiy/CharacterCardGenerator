import jsPDF from 'jspdf';
import type { CharacterCard, ImageFillMode, ImageFocus, NameSettings, CardSide } from '../types';
import {
  CUT_LINE_WIDTH_MM,
  FOLD_LINE_WIDTH_MM,
  FOLD_LINE_DASH_MM,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  getBaseHeight,
  getCardHeight,
  getCardWidth,
  getFaceHeight,
  getHalfWidth,
  getHalfHeight,
  getLayoutColumns,
  getItemsPerPage,
  isPawnLayout,
  type CardsPerPageOption,
} from '../constants';
import { packPawnSheet, type PawnPlacement } from './pawnLayout';
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
          getNameSizeScale(nameSettings.fontSizePercent)
        );
      }
    }
  }

  const outputCanvas = rotatePortraitToHalf(portraitCanvas, widthPx, heightPx, isSideB);

  // Halves are opaque except a sub-pixel edge sliver, so PNG only added bytes:
  // jsPDF kept its alpha as a full-size SMask and (without the compress option)
  // stored every channel uncompressed. Name-bearing halves use a slightly higher
  // JPEG quality to keep fitted text crisp at print dpi.
  const jpegQuality = shouldShowName && nameSettings ? 0.95 : 0.94;
  return { dataUrl: outputCanvas.toDataURL('image/jpeg', jpegQuality), format: 'JPEG' };
};

const renderUprightHalfToDataUrl = (
  image: PrintImage,
  widthPx: number,
  heightPx: number,
  fillMode: ImageFillMode = 'cover',
  imageFocus?: ImageFocus,
  rotate180 = false
): { dataUrl: string; format: RasterFormat } => {
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = get2dContext(canvas);

  if (rotate180) {
    ctx.translate(widthPx / 2, heightPx / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-widthPx / 2, -heightPx / 2);
  }

  if (fillMode !== 'cover') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);
  }

  const layout = layoutImageFill(
    fillMode,
    widthPx,
    heightPx,
    image.width,
    image.height,
    imageFocus
  );
  ctx.drawImage(image, layout.left, layout.top, layout.width, layout.height);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.94), format: 'JPEG' };
};

const drawVerticalFoldLine = (
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

const drawHorizontalFoldLine = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number
) => {
  pdf.setDrawColor(120, 100, 60);
  pdf.setLineWidth(FOLD_LINE_WIDTH_MM);
  pdf.setLineDashPattern([FOLD_LINE_DASH_MM, FOLD_LINE_DASH_MM], 0);
  pdf.line(x + 0.5, y, x + width - 0.5, y);
  pdf.setLineDashPattern([], 0);
};

const drawPawnBase = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  dash: 'top' | 'bottom'
) => {
  pdf.setDrawColor(90, 80, 60);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([], 0);
  pdf.rect(x, y, width, height);

  pdf.setDrawColor(120, 100, 60);
  pdf.setLineWidth(FOLD_LINE_WIDTH_MM);
  pdf.setLineDashPattern([FOLD_LINE_DASH_MM, FOLD_LINE_DASH_MM], 0);
  const dashY = dash === 'top' ? y : y + height;
  pdf.line(x + 0.4, dashY, x + width - 0.4, dashY);
  pdf.setLineDashPattern([], 0);
};

const drawCutLines = (
  pdf: jsPDF,
  cardsOnPage: number,
  cardHeight: number,
  cardsPerPage: CardsPerPageOption
) => {
  const pawn = isPawnLayout(cardsPerPage);
  pdf.setDrawColor(pawn ? 90 : 255, pawn ? 80 : 255, pawn ? 60 : 255);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);

  const mx = PAGE_MARGIN_X_MM;
  const my = PAGE_MARGIN_Y_MM;
  const columns = getLayoutColumns(cardsPerPage);
  const cardWidth = getCardWidth(cardsPerPage);

  if (columns > 1) {
    const rowsOnPage = Math.ceil(cardsOnPage / columns);
    const lastRowCount =
      cardsOnPage % columns === 0 ? columns : cardsOnPage % columns;

    const rowsInColumn = (col: number): number => {
      if (col < 0 || col >= columns) return 0;
      return col < lastRowCount ? rowsOnPage : rowsOnPage - 1;
    };

    const colsInRow = (row: number): number => {
      if (row < 0 || row >= rowsOnPage) return 0;
      return row === rowsOnPage - 1 ? lastRowCount : columns;
    };

    for (let c = 0; c <= columns; c++) {
      const rows = Math.max(rowsInColumn(c - 1), rowsInColumn(c));
      if (rows <= 0) continue;
      const x = mx + c * cardWidth;
      pdf.line(x, my, x, my + rows * cardHeight);
    }

    for (let r = 1; r < rowsOnPage; r++) {
      const cols = Math.max(colsInRow(r - 1), colsInRow(r));
      const y = my + r * cardHeight;
      pdf.line(mx, y, mx + cols * cardWidth, y);
    }
  } else {
    const contentRight = mx + cardWidth;

    for (let i = 1; i < cardsOnPage; i++) {
      const y = my + i * cardHeight;
      pdf.line(mx, y, contentRight, y);
    }
  }
};

const drawPawnOutlines = (
  pdf: jsPDF,
  placements: PawnPlacement[],
  cellWidth: number,
  cellHeight: number
) => {
  pdf.setDrawColor(90, 80, 60);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);
  for (const placement of placements) {
    const x = PAGE_MARGIN_X_MM + placement.col * cellWidth;
    const y = PAGE_MARGIN_Y_MM + placement.row * cellHeight;
    pdf.rect(x, y, placement.colSpan * cellWidth, placement.rowSpan * cellHeight);
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
    // Enables FlateEncode: PNG halves (DnD stats panels) get Paeth/level-9 re-compression
    // and page content streams are compressed. JPEG halves are embedded as-is (DCTDecode).
    compress: true,
  });

  const pawn = isPawnLayout(cardsPerPage);
  const itemsPerPage = getItemsPerPage(cardsPerPage);
  const cardHeight = getCardHeight(cardsPerPage);
  const cardWidth = getCardWidth(cardsPerPage);
  const halfWidth = getHalfWidth(cardsPerPage);
  const halfHeight = getHalfHeight(cardsPerPage);
  const faceHeight = getFaceHeight(cardsPerPage);
  const baseHeight = getBaseHeight(cardsPerPage);

  const pxPerMm = 10;
  const halfGapMm = 1;
  const halfWidthPx = halfWidth * pxPerMm;
  const halfHeightPx = halfHeight * pxPerMm;

  if (pawn) {
    const placements = packPawnSheet(cards);
    const pageCount = placements[placements.length - 1].page + 1;
    let completed = 0;

    for (let page = 0; page < pageCount; page++) {
      if (page > 0) pdf.addPage();
      const onPage = placements.filter((placement) => placement.page === page);

      for (const placement of onPage) {
        const card = placement.card;
        const x = PAGE_MARGIN_X_MM + placement.col * cardWidth;
        const y = PAGE_MARGIN_Y_MM + placement.row * cardHeight;
        const faceWidth = halfWidth * placement.colSpan;
        const scaledFaceHeight = faceHeight * placement.rowSpan;
        const scaledBaseHeight = baseHeight * placement.rowSpan;
        const sideHeight = scaledFaceHeight + scaledBaseHeight;
        const foldY = y + sideHeight;
        const fillMode = card.imageFillMode ?? 'cover';
        const printWidthPx = halfWidthPx * placement.colSpan;
        const printHeightPx = halfHeightPx * placement.rowSpan;
        const printImage = await loadPrintImage(card.imageUrl, printWidthPx, printHeightPx);

        try {
          const sideA = renderUprightHalfToDataUrl(
            printImage,
            printWidthPx,
            printHeightPx,
            fillMode,
            card.imageFocus,
            true
          );
          const sideB = renderUprightHalfToDataUrl(
            printImage,
            printWidthPx,
            printHeightPx,
            fillMode,
            card.imageFocus
          );
          drawPawnBase(pdf, x, y, faceWidth, scaledBaseHeight, 'bottom');
          pdf.addImage(sideA.dataUrl, sideA.format, x, y + scaledBaseHeight, faceWidth, scaledFaceHeight);
          drawHorizontalFoldLine(pdf, x, foldY, faceWidth);
          pdf.addImage(sideB.dataUrl, sideB.format, x, foldY, faceWidth, scaledFaceHeight);
          drawPawnBase(pdf, x, foldY + scaledFaceHeight, faceWidth, scaledBaseHeight, 'top');
        } finally {
          closePrintImage(printImage);
        }

        onProgress?.(++completed, cards.length);
      }

      drawPawnOutlines(pdf, onPage, cardWidth, cardHeight);
    }
  } else {
    for (let i = 0; i < cards.length; i++) {
      const pageIndex = Math.floor(i / itemsPerPage);
      const positionOnPage = i % itemsPerPage;

      if (positionOnPage === 0 && pageIndex > 0) {
        pdf.addPage();
      }

      const x = PAGE_MARGIN_X_MM;
      const y = PAGE_MARGIN_Y_MM + positionOnPage * cardHeight;
      const fillMode = cards[i].imageFillMode ?? 'cover';
      const nameSettings = cards[i].nameSettings?.enabled
        ? cards[i].nameSettings
        : undefined;
      const stats = cards[i].dndStats;
      const printImage = await loadPrintImage(
        cards[i].imageUrl,
        halfHeightPx,
        halfWidthPx
      );

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

        const sideBX = x - halfGapMm / 2;
        const sideAX = x + halfWidth + halfGapMm / 2;
        const foldX = x + halfWidth;

        pdf.addImage(sideB.dataUrl, sideB.format, sideBX, y, halfWidth, cardHeight);
        pdf.addImage(sideA.dataUrl, sideA.format, sideAX, y, halfWidth, cardHeight);
        drawVerticalFoldLine(pdf, foldX, y, cardHeight);
        onProgress?.(i + 1, cards.length);
      } finally {
        closePrintImage(printImage);
      }
    }

    const totalPages = Math.ceil(cards.length / itemsPerPage);
    for (let page = 0; page < totalPages; page++) {
      pdf.setPage(page + 1);
      const cardsOnThisPage = Math.min(
        itemsPerPage,
        cards.length - page * itemsPerPage
      );
      drawCutLines(pdf, cardsOnThisPage, cardHeight, cardsPerPage);
    }
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = pawn
    ? `pawns-${timestamp}.pdf`
    : `initiative-cards-${timestamp}.pdf`;
  pdf.setProperties({ title: filename });
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);

  return { url, filename, blob };
};
