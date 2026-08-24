import { isPawnLayout, type CardsPerPageOption } from '../constants';
import { CardFace } from './CardFace';
import type { CardSide, CharacterCard, ImageFocus } from '../types';

interface CardSideFrameProps {
  card: CharacterCard;
  side: CardSide;
  cardsPerPage: CardsPerPageOption;
  imageClassName?: string;
  pannable?: boolean;
  onImageFocusChange?: (focus: ImageFocus) => void;
  onPortraitClick?: () => void;
}

export function CardSideFrame({
  card,
  side,
  cardsPerPage,
  imageClassName,
  pannable,
  onImageFocusChange,
  onPortraitClick,
}: CardSideFrameProps) {
  const pawn = isPawnLayout(cardsPerPage);

  return (
    <div className={`card-side-frame${pawn ? ' is-pawn' : ''}`}>
      <div className="card-side-face">
        <CardFace
          card={card}
          side={side}
          imageClassName={imageClassName}
          pannable={pannable}
          overlaysEnabled={!pawn}
          onImageFocusChange={onImageFocusChange}
          onPortraitClick={onPortraitClick}
        />
      </div>
      {pawn && <div className="pawn-base" aria-hidden="true" />}
    </div>
  );
}
