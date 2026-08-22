import { useRef, useCallback, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { ACCEPTED_IMAGE_EXTENSIONS } from '../constants';
import type { CharacterCard } from '../types';
import { ingestImageFiles } from '../utils/imageIngest';
import './ImageUpload.css';

interface ImageUploadProps {
  onImagesUploaded: (cards: CharacterCard[]) => void;
  variant?: 'zone' | 'tile';
  aspectRatio?: number;
}

export function ImageUpload({
  onImagesUploaded,
  variant = 'zone',
  aspectRatio,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTile = variant === 'tile';

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const { cards, errors } = await ingestImageFiles(files);
      setError(errors.length > 0 ? errors.join('\n') : null);
      if (cards.length > 0) onImagesUploaded(cards);
    },
    [onImagesUploaded]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void processFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    void processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_EXTENSIONS}
      multiple
      onChange={handleFileChange}
      className="upload-input"
      onClick={(e) => e.stopPropagation()}
    />
  );

  if (isTile) {
    return (
      <div
        className={`card-add ${isDragging ? 'card-add-active' : ''}`}
        style={aspectRatio != null ? { aspectRatio } : undefined}
        role="button"
        tabIndex={0}
        aria-label="Добавить карточку"
        title={error ?? 'Добавить карточку'}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {fileInput}
        <svg
          className="card-add-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="card-add-label">Добавить</span>
        {error && (
          <span className="card-add-error" role="alert">
            Неверный формат
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="upload-section-inner">
      <div
        className={`upload-zone ${isDragging ? 'upload-zone-active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Загрузить изображения персонажей"
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {fileInput}
        <div className="upload-content">
          <svg
            className="upload-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="upload-text">
            Перетащите изображения персонажей сюда или нажмите, чтобы выбрать
          </p>
          <p className="upload-hint">Поддерживаются JPG, PNG, WEBP и HEIC</p>
        </div>
      </div>
      {error && (
        <p className="upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
