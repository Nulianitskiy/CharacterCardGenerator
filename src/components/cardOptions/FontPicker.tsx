import { useEffect, useMemo, useRef, useState } from 'react';
import type { NameFontValue } from '../../types';
import {
  filterNameFontChoices,
  fontValuesEqual,
  getFontPreviewCss,
  isLocalNameFont,
  makeLocalNameFont,
  type NameFontChoice,
} from '../../utils/nameFont';
import {
  getCachedLocalFontFamilies,
  isLocalFontAccessSupported,
  loadLocalFontFamilies,
} from '../../utils/localFonts';
import { BUILTIN_FONT_CHOICES, SYSTEM_FONT_CHOICES } from './optionLists';
import './FontPicker.css';

interface FontPickerProps {
  value: NameFontValue;
  onChange: (value: NameFontValue) => void;
}

type LocalStatus = 'unsupported' | 'idle' | 'loading' | 'ready' | 'error';

const PRESET_GROUP_LABEL = 'Встроенные шрифты';
const SYSTEM_GROUP_LABEL = 'Системные шрифты';
const LOCAL_GROUP_LABEL = 'Шрифты устройства';
const MAX_VISIBLE_PER_GROUP = 150;

const choiceKey = (choice: NameFontChoice): string =>
  isLocalNameFont(choice.value) ? `l:${choice.value.localFamily.toLowerCase()}` : `b:${choice.value}`;

const localToFamilies = (families: readonly string[]): NameFontChoice[] =>
  families.map((family) => ({ value: makeLocalNameFont(family), label: family }));

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localStatus, setLocalStatus] = useState<LocalStatus>(() => {
    if (getCachedLocalFontFamilies()) return 'ready';
    return isLocalFontAccessSupported() ? 'idle' : 'unsupported';
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [localFamilies, setLocalFamilies] = useState<string[]>(() => getCachedLocalFontFamilies() ?? []);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const localChoices = useMemo(() => {
    const taken = new Set(
      [...BUILTIN_FONT_CHOICES, ...SYSTEM_FONT_CHOICES].map((choice) => choice.label.toLowerCase())
    );
    return localToFamilies(localFamilies).filter(
      (choice) => !taken.has(choice.label.toLowerCase())
    );
  }, [localFamilies]);

  const systemChoices = useMemo(() => {
    if (localStatus !== 'ready') return SYSTEM_FONT_CHOICES;
    const installed = new Set(localFamilies.map((family) => family.toLowerCase()));
    return SYSTEM_FONT_CHOICES.filter((choice) => !installed.has(choice.label.toLowerCase()));
  }, [localStatus, localFamilies]);

  const filteredPresets = filterNameFontChoices(BUILTIN_FONT_CHOICES, query);
  const filteredLocal = filterNameFontChoices(localChoices, query);
  const filteredSystem = filterNameFontChoices(systemChoices, query);
  const nothingFound =
    filteredPresets.length === 0 && filteredLocal.length === 0 && filteredSystem.length === 0;

  const currentLabel = useMemo(() => {
    const all = [...BUILTIN_FONT_CHOICES, ...SYSTEM_FONT_CHOICES, ...localChoices];
    const match = all.find((choice) => fontValuesEqual(choice.value, value));
    if (match) return match.label;
    return isLocalNameFont(value) ? value.localFamily : String(value);
  }, [value, localChoices]);

  const handleRequestLocalFonts = () => {
    setLocalStatus('loading');
    setLocalError(null);
    void loadLocalFontFamilies().then(
      (families) => {
        setLocalFamilies(families);
        setLocalStatus('ready');
      },
      (error: unknown) => {
        setLocalStatus('error');
        const name = error instanceof Error ? error.name : '';
        setLocalError(
          name === 'NotAllowedError'
            ? 'Доступ к шрифтам запрещён. Разрешите его в настройках сайта.'
            : 'Не удалось получить список шрифтов устройства.'
        );
      }
    );
  };

  const renderOption = (choice: NameFontChoice) => (
    <button
      key={choiceKey(choice)}
      type="button"
      className={`font-picker-option ${fontValuesEqual(choice.value, value) ? 'active' : ''}`}
      style={getFontPreviewCss(choice.value)}
      onClick={() => {
        onChange(choice.value);
        setOpen(false);
        setQuery('');
      }}
    >
      {choice.label}
    </button>
  );

  const renderGroup = (label: string, choices: readonly NameFontChoice[]) => {
    if (choices.length === 0) return null;
    const visible = choices.slice(0, MAX_VISIBLE_PER_GROUP);
    return (
      <div className="font-picker-group">
        <span className="font-picker-group-label">{label}</span>
        {visible.map(renderOption)}
        {choices.length > visible.length && (
          <p className="font-picker-hint">
            Показаны первые {MAX_VISIBLE_PER_GROUP} — уточните поиск по названию.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="font-picker" ref={rootRef}>
      <button
        type="button"
        className={`font-picker-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
      >
        <span className="font-picker-trigger-label" style={getFontPreviewCss(value)}>
          {currentLabel}
        </span>
        <span className="font-picker-trigger-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="font-picker-panel">
          <input
            ref={searchRef}
            type="text"
            className="setting-input font-picker-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию…"
            aria-label="Поиск шрифта"
          />

          <div className="font-picker-list">
            {renderGroup(PRESET_GROUP_LABEL, filteredPresets)}
            {localStatus === 'ready' && renderGroup(LOCAL_GROUP_LABEL, filteredLocal)}
            {renderGroup(SYSTEM_GROUP_LABEL, filteredSystem)}

            {localStatus === 'unsupported' && (
              <p className="font-picker-hint">
                Список шрифтов устройства доступен только в браузерах на Chromium — выбирайте из
                системных шрифтов выше.
              </p>
            )}
            {(localStatus === 'idle' || localStatus === 'loading' || localStatus === 'error') && (
              <>
                <button
                  type="button"
                  className="font-picker-action"
                  onClick={handleRequestLocalFonts}
                  disabled={localStatus === 'loading'}
                >
                  {localStatus === 'loading'
                    ? 'Загружаем шрифты устройства…'
                    : localStatus === 'error'
                      ? 'Попробовать снова'
                      : 'Показать шрифты устройства'}
                </button>
                {localStatus === 'error' && localError && (
                  <p className="font-picker-error">{localError}</p>
                )}
              </>
            )}
            {localStatus === 'ready' && localFamilies.length === 0 && (
              <p className="font-picker-hint">Шрифты на устройстве не найдены.</p>
            )}
            {nothingFound && <p className="font-picker-hint">Ничего не найдено.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
