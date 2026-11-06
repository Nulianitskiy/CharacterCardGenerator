import jsPDF from 'jspdf';
import type { CharacterCard, GameObject, ImageFillMode, ImageFocus, NameSettings, CardSide } from '../types';
import {
  CUT_LINE_WIDTH_MM,
  FOLD_LINE_WIDTH_MM,
  FOLD_LINE_DASH_MM,
  OBJECTS_PER_PAGE,
  PAWN_BASE_OUTLINE_WIDTH_MM,
  PRINT_PX_PER_MM,
  getHalfWidth,
  getHalfHeight,
  getItemsPerPage,
  isPawnLayout,
  type CardsPerPageOption,
} from '../constants';
import { packPawnSheet, type PawnPlacement } from './pawnLayout';
import {
  INITIATIVE_SIDE_A_ROTATION_DEG,
  INITIATIVE_SIDE_B_ROTATION_DEG,
  gridCutSegments,
  initiativeSlot,
  pawnSlotGeometry,
  sheetGridSpec,
  type RectMm,
  type SegmentMm,
} from './pdfLayout';
import {
  objectCutSegments,
  objectFaceRect,
  objectPageCount,
  packObjectSheet,
} from './objectLayout';
import {
  objectShirtImagePrintSizePx,
  renderDescriptionFace,
  renderShirtFace,
} from './objectPdfRender';
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
  rotationDeg: number
): HTMLCanvasElement => {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = widthPx;
  outputCanvas.height = heightPx;
  const outputCtx = get2dContext(outputCanvas);
  outputCtx.translate(widthPx / 2, heightPx / 2);
  outputCtx.rotate((rotationDeg * Math.PI) / 180);
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
  const outputCanvas = rotatePortraitToHalf(
    portraitCanvas,
    widthPx,
    heightPx,
    isSideB ? INITIATIVE_SIDE_B_ROTATION_DEG : INITIATIVE_SIDE_A_ROTATION_DEG
  );
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

  const outputCanvas = rotatePortraitToHalf(
    portraitCanvas,
    widthPx,
    heightPx,
    isSideB ? INITIATIVE_SIDE_B_ROTATION_DEG : INITIATIVE_SIDE_A_ROTATION_DEG
  );

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

const drawFoldLine = (pdf: jsPDF, fold: SegmentMm) => {
  pdf.setDrawColor(120, 100, 60);
  pdf.setLineWidth(FOLD_LINE_WIDTH_MM);
  pdf.setLineDashPattern([FOLD_LINE_DASH_MM, FOLD_LINE_DASH_MM], 0);
  pdf.line(fold.x1, fold.y1, fold.x2, fold.y2);
  pdf.setLineDashPattern([], 0);
};

const drawBaseTab = (pdf: jsPDF, base: RectMm, tabFold: SegmentMm) => {
  pdf.setDrawColor(90, 80, 60);
  pdf.setLineWidth(PAWN_BASE_OUTLINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);
  pdf.rect(base.x, base.y, base.width, base.height);
  drawFoldLine(pdf, tabFold);
};

const drawCutLines = (
  pdf: jsPDF,
  cardsOnPage: number,
  cardsPerPage: CardsPerPageOption
) => {
  const pawn = isPawnLayout(cardsPerPage);
  pdf.setDrawColor(pawn ? 90 : 255, pawn ? 80 : 255, pawn ? 60 : 255);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);

  for (const segment of gridCutSegments(cardsOnPage, sheetGridSpec(cardsPerPage))) {
    pdf.line(segment.x1, segment.y1, segment.x2, segment.y2);
  }
};

const drawPawnOutlines = (
  pdf: jsPDF,
  placements: PawnPlacement[],
  cardsPerPage: CardsPerPageOption
) => {
  pdf.setDrawColor(90, 80, 60);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);
  for (const placement of placements) {
    const { cell } = pawnSlotGeometry(
      placement.col,
      placement.row,
      placement.colSpan,
      placement.rowSpan,
      cardsPerPage
    );
    pdf.rect(cell.x, cell.y, cell.width, cell.height);
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
  const halfWidth = getHalfWidth(cardsPerPage);
  const halfHeight = getHalfHeight(cardsPerPage);

  const halfWidthPx = halfWidth * PRINT_PX_PER_MM;
  const halfHeightPx = halfHeight * PRINT_PX_PER_MM;

  if (pawn) {
    const placements = packPawnSheet(cards);
    const pageCount = placements[placements.length - 1].page + 1;
    let completed = 0;

    for (let page = 0; page < pageCount; page++) {
      if (page > 0) pdf.addPage();
      const onPage = placements.filter((placement) => placement.page === page);

      for (const placement of onPage) {
        const card = placement.card;
        const geometry = pawnSlotGeometry(
          placement.col,
          placement.row,
          placement.colSpan,
          placement.rowSpan,
          cardsPerPage
        );
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
          drawBaseTab(pdf, geometry.sideA.base, geometry.sideA.tabFold);
          pdf.addImage(
            sideA.dataUrl,
            sideA.format,
            geometry.sideA.face.x,
            geometry.sideA.face.y,
            geometry.sideA.face.width,
            geometry.sideA.face.height
          );
          drawFoldLine(pdf, geometry.middleFold);
          pdf.addImage(
            sideB.dataUrl,
            sideB.format,
            geometry.sideB.face.x,
            geometry.sideB.face.y,
            geometry.sideB.face.width,
            geometry.sideB.face.height
          );
          drawBaseTab(pdf, geometry.sideB.base, geometry.sideB.tabFold);
        } finally {
          closePrintImage(printImage);
        }

        onProgress?.(++completed, cards.length);
      }

      drawPawnOutlines(pdf, onPage, cardsPerPage);
    }
  } else {
    for (let i = 0; i < cards.length; i++) {
      const pageIndex = Math.floor(i / itemsPerPage);
      const positionOnPage = i % itemsPerPage;

      if (positionOnPage === 0 && pageIndex > 0) {
        pdf.addPage();
      }

      const slot = initiativeSlot(positionOnPage, cardsPerPage);
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

        pdf.addImage(
          sideB.dataUrl,
          sideB.format,
          slot.sideB.x,
          slot.sideB.y,
          slot.sideB.width,
          slot.sideB.height
        );
        pdf.addImage(
          sideA.dataUrl,
          sideA.format,
          slot.sideA.x,
          slot.sideA.y,
          slot.sideA.width,
          slot.sideA.height
        );
        drawFoldLine(pdf, slot.fold);
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
      drawCutLines(pdf, cardsOnThisPage, cardsPerPage);
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

/**
 * Object-card sheet: each GameObject prints as a shirt face followed by its
 * description face in adjacent grid cells (see `packObjectSheet`), with white
 * cut guides and no fold marks — pairs are meant to be cut out and glued.
 */
export const generateObjectsPDF = async (
  objects: GameObject[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ url: string; filename: string; blob: Blob }> => {
  if (objects.length === 0) {
    throw new Error('No objects to generate');
  }

  await ensureNameFontsLoaded();

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const placements = packObjectSheet(objects);
  const imagePrintSize = objectShirtImagePrintSizePx();

  let currentPage = -1;
  let completed = 0;

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const shirtPlacement = placements[i * 2];
    const descriptionPlacement = placements[i * 2 + 1];

    if (shirtPlacement.page !== currentPage) {
      if (currentPage >= 0) pdf.addPage();
      currentPage = shirtPlacement.page;
    }

    const printImage = await loadPrintImage(
      object.imageUrl,
      imagePrintSize.width,
      imagePrintSize.height
    );

    try {
      const shirt = renderShirtFace(object, printImage);
      const description = renderDescriptionFace(object);

      const shirtRect = objectFaceRect(shirtPlacement.col, shirtPlacement.row);
      const descriptionRect = objectFaceRect(
        descriptionPlacement.col,
        descriptionPlacement.row
      );
      pdf.addImage(shirt, 'JPEG', shirtRect.x, shirtRect.y, shirtRect.width, shirtRect.height);
      pdf.addImage(
        description,
        'JPEG',
        descriptionRect.x,
        descriptionRect.y,
        descriptionRect.width,
        descriptionRect.height
      );
    } finally {
      closePrintImage(printImage);
    }

    onProgress?.(++completed, objects.length);
  }

  const pageCount = objectPageCount(objects);
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(CUT_LINE_WIDTH_MM);
  pdf.setLineDashPattern([], 0);
  for (let page = 0; page < pageCount; page++) {
    pdf.setPage(page + 1);
    const objectsOnPage = Math.min(
      OBJECTS_PER_PAGE,
      objects.length - page * OBJECTS_PER_PAGE
    );
    for (const segment of objectCutSegments(objectsOnPage)) {
      pdf.line(segment.x1, segment.y1, segment.x2, segment.y2);
    }
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `objects-${timestamp}.pdf`;
  pdf.setProperties({ title: filename });
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);

  return { url, filename, blob };
};
