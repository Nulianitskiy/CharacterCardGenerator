import type { GameObject } from '../types';
import { getGameObjectCellHeight, getGameObjectCellWidth } from '../constants';
import { ImageUpload, type UploadIngestResult } from './ImageUpload';
import { ObjectDescriptionFace, ObjectShirtFace } from './ObjectFaces';
import './ObjectGrid.css';

const OBJECT_FACE_ASPECT = getGameObjectCellWidth() / getGameObjectCellHeight();

interface ObjectGridProps {
  objects: GameObject[];
  selectedObjectId: string | null;
  ingest: (files: FileList) => Promise<UploadIngestResult<GameObject>>;
  onAddObjects: (objects: GameObject[]) => void;
  onSelectObject: (id: string) => void;
  onRemoveObject: (id: string) => void;
}

export function ObjectGrid({
  objects,
  selectedObjectId,
  ingest,
  onAddObjects,
  onSelectObject,
  onRemoveObject,
}: ObjectGridProps) {
  if (objects.length === 0) {
    return (
      <ImageUpload
        variant="zone"
        ingest={ingest}
        onUploaded={onAddObjects}
        labels={{
          zoneAria: 'Загрузить изображения предметов',
          zoneText: 'Перетащите изображения предметов сюда или нажмите, чтобы выбрать',
        }}
      />
    );
  }

  return (
    <div className="object-grid">
      {objects.map((object, index) => (
        <article
          key={object.id}
          className={`object-tile${object.id === selectedObjectId ? ' selected' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Объект ${object.name || index + 1}, открыть настройки`}
          aria-pressed={object.id === selectedObjectId}
          onClick={() => onSelectObject(object.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectObject(object.id);
            }
          }}
        >
          <div className="object-pair" style={{ aspectRatio: `${2 * OBJECT_FACE_ASPECT} / 1` }}>
            <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
              <ObjectShirtFace object={object} />
            </div>
            <div className="object-pair-face" style={{ aspectRatio: `${OBJECT_FACE_ASPECT}` }}>
              <ObjectDescriptionFace object={object} />
            </div>
          </div>
          <span className="object-tile-index" aria-hidden="true">
            {index + 1}
          </span>
          <button
            type="button"
            className="object-tile-remove"
            aria-label="Удалить объект"
            title="Удалить объект"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveObject(object.id);
            }}
          >
            ×
          </button>
        </article>
      ))}
      <ImageUpload
        variant="tile"
        ingest={ingest}
        onUploaded={onAddObjects}
        aspectRatio={2 * OBJECT_FACE_ASPECT}
        labels={{ addAria: 'Добавить объект', addTitle: 'Добавить объект' }}
      />
    </div>
  );
}
