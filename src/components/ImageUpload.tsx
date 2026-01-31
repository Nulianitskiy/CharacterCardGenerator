import { useRef, useCallback } from 'react';
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '../constants';
import type { CharacterCard } from '../types';

interface ImageUploadProps {
  onImagesUploaded: (cards: CharacterCard[]) => void;
}

/**
 * Generates a unique ID for each uploaded image
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Component for uploading character images
 * Supports drag-and-drop and click-to-browse
 */
export function ImageUpload({ onImagesUploaded }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Processes uploaded files and creates CharacterCard objects
   */
  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const validFiles = Array.from(files).filter((file) =>
        ACCEPTED_IMAGE_TYPES.includes(file.type)
      );

      if (validFiles.length === 0) return;

      const cards: CharacterCard[] = validFiles.map((file) => ({
        id: generateId(),
        file,
        imageUrl: URL.createObjectURL(file),
      }));

      onImagesUploaded(cards);
    },
    [onImagesUploaded]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so the same file can be uploaded again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className="upload-zone"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        multiple
        onChange={handleFileChange}
        className="upload-input"
      />
      <div className="upload-content">
        <svg
          className="upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17,8 12,3 7,8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="upload-text">
          Drop character images here or click to browse
        </p>
        <p className="upload-hint">Supports JPG, PNG, WEBP</p>
      </div>
    </div>
  );
}
