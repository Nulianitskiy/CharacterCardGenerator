# Дорожная карта

План развития по итогам аудита кода (ноябрь 2026) и обзора аналогов на рынке.
Статусы: ✅ сделано · 🚧 в работе · ⬜ очередь.

## 1. Продуктовые идеи (по материалам рынка)

Прямые аналоги и источники идей: Tablemancer monster cards, Monsterbrew,
GM Craft Tavern paper mini maker, rpgtokens.com, Paper Standee Maker (itch.io),
MiniFold initiative cards, dm.tools tracker.

### Высокая ценность

- 🚧 **«Объекты» — физические карточки предметов.** Новая сущность: рубашка
  (имя + изображение + слоган на свитке + бейдж количества) и сторона описания
  (justified-текст в рамке), напечатанные парами на одном A4. План:
  `docs/objects-feature-plan.md`.
- ⬜ **Импорт существ из SRD 5e.** Открытые данные без ключей: dnd5eapi.co, Open5e API
  (~400 монстров в JSON). Кнопка «взять существо из бестиария» автозаполняет
  D&D-панель: имя, КД, хп, характеристики, модификаторы. Проект остаётся
  клиентским (простой fetch к публичному API).
- ⬜ **Сохранение проекта.** Сейчас всё живёт в памяти, перезагрузка страницы всё
  теряет (защита only через `beforeunload`). Шаги:
  1. экспорт/импорт JSON карточек (без файлов — картинки пользователь дозагружает);
  2. IndexedDB с самими изображениями → настоящие сессии, `beforeunload` можно убрать.
- ⬜ **PWA / офлайн.** Приложение целиком клиентское — идеальный кандидат на
  `vite-plugin-pwa`: manifest, service worker, «установить как приложение»,
  работа на играх без интернета.
- ⬜ **Чистые карточки под любую систему.** Идея MiniFold: карточка с пустыми
  полями (имя, инициатива, пара строк заметок) вместо пресетов D&D — расширяет
  аудиторию за пределы 5e (PF2, CoC, авторские системы).

### Средняя ценность

- ⬜ **Круглые токены.** Второй layout в pawn-механизме: круглая фишка с именной
  каёмкой (как у rpgtokens.com / Paper Standee Maker).
- ⬜ **Печать по инициативе.** Сортировка карточек на листе по значению
  инициативы/КД, номер хода на карточке — связка с настольным трекингом боя.
- ⬜ **AI-портреты.** Тренд 2026 года (CharGen и др.). Только через пользовательский
  API-ключ внешнего сервиса, чтобы не ломать философию «no backend, no keys»;
  consider как эксперимент, не как ядро.
- ⬜ **Английский UI (i18n RU/EN).** Все строки захардкожены по-русски, включая HTML
  загрузочной вкладки. Слой i18n откроет GitHub-аудиторию: звёзды, фидбек, PR.

## 2. Техническое здоровье

### Архитектура

- ⬜ **Reducer/store вместо 16 useCallback в `App.tsx`.** Единый
  `updateCard(id, patch)`, меньше пропсов-«сверл» (в `CardOptionsMenu` сейчас 15).
  Попутно исправить нечистые updater-функции `setCards` с
  `URL.createObjectURL/revokeObjectURL` внутри (утечка blob-URL в StrictMode) и
  ревocation карточных URL при unmount.
- ⬜ **Единый spec D&D-панели.** Цвета/фракции сейчас живут дважды:
  `DndStatsPanel.css` и `dndStatsRender.ts`. Известные расхождения экран/PRINT:
  длинное имя (ellipsis vs вписывание), игнорирование `fontSizePercent` в PDF.
  Нарушение правила «one geometry, two renderers».
- ✅ **Константы печати в `constants.ts`.** `INITIATIVE_HALF_GAP_MM`,
  `PRINT_PX_PER_MM`, `FOLD_LINE_INSET_MM`, `PAWN_BASE_DASH_INSET_MM`,
  `PAWN_BASE_OUTLINE_WIDTH_MM` выведены из «магических чисел» `pdfGenerator.ts`.
- ⬜ `generatePDF` разбить на `generatePawnSheet` / `generateInitiativeSheet`.
- ⬜ Устранить дублирование union'ов `NameBackgroundType` и `PresetOverlayId`.

### Производительность

- ⬜ **Ленивый импорт jsPDF** по клику «Создать PDF» — jsPDF с опциональными
  dompurify/html2canvas/canvg сейчас едет в первом же чанке.
- ⬜ `React.memo` для `Card`/`FilledCharacterImage` — правка имени одной карточки
  перерисовывает всю сетку.
- ⬜ Кэшировать геометрию карточек на время drag-reorder в `CardGrid`
  (сейчас `getBoundingClientRect` по всем карточкам на каждый pointermove).
- ⬜ Подбор размера имени — binary search вместо цикла `fontSize -= 1`.

### Тесты и CI

- ✅ **CI запускает lint и тесты до сборки и деплоя** (раньше в прод уезжал
  сломанный suite, если `tsc -b` проходил).
- ✅ **Чистая модуль раскладки листа `src/utils/pdfLayout.ts`** — прямоугольники
  половин, линии сгиба, линии реза, геометрия pawn-слотов — вынесены из
  `pdfGenerator.ts` и покрыты тестами (`pdfLayout.test.ts`).
- ⬜ Визуальная регрессия «preview = print» (Vitest browser mode / Playwright):
  фича-обещание проекта сейчас нигде не проверяется.
- ⬜ Тесты исчерпываемости: `presetOverlays ↔ types`, `optionLists ↔ union`.
- ⬜ Dependabot, PR-шаблон, превью-деплои GitHub Pages для PR.

### UX

- ⬜ Undo/redo (сейчас «Очистить все» и удаление необратимы).
- ⬜ Мультивыделение: применить пресет/фон к нескольким карточкам, пакетное удаление.
- ⬜ Тосты вместо `window.alert/confirm`; авто-скрытие ошибок ingest.
- ⬜ Доступность: панель опций → `dialog` с focus-trap; keyboard-reorder (dnd-kit
  вместо ~200 строк ручного pointer-drag в `CardGrid.tsx`); keyboard-панорамирование кропа.
- ⬜ `handleReorderCards` не должен молча терять карточки при гонке с удалением.
- ⬜ Сохранять состояние FontPicker при переключении карточек (сейчас remount по key).

### Полировка

- ⬜ `crypto.randomUUID()` вместо `Date.now()+Math.random()` в `generateId`.
- ⬜ Prettier/`.editorconfig`, поле `engines` в package.json (CI на Node 20).
- ⬜ Favicon вместо vite-заглушки, OG/Twitter-теги, `theme-color`, canonical в index.html.

## 3. Очередь (по приоритету)

| # | Что | Статус |
|---|-----|--------|
| 1 | CI: lint+test перед deploy | ✅ |
| 2 | Тесты placement-математики PDF (чистый модуль `pdfLayout.ts`) | ✅ |
| 3 | Сохранение проекта: JSON export/import → IndexedDB | ⬜ |
| 4 | Reducer/store + фикс blob-утечек | ⬜ |
| 5 | Импорт SRD-монстров (dnd5eapi.co / Open5e) | ⬜ |
| 5b | Фича «Объекты» (карточки предметов) — план в docs/objects-feature-plan.md | 🚧 |
| 6 | Единый spec D&D-панели + добрать константы в `constants.ts` | ⬜ |
| 7 | Lazy-import jsPDF + React.memo + rect-cache для drag | ⬜ |
| 8 | PWA (vite-plugin-pwa) | ⬜ |
| 9 | Пустые карточки «под любую систему» | ⬜ |
| 10 | i18n RU/EN | ⬜ |
