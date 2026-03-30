# Платформа Громади

## Current State
Single-file React app (App.tsx, ~2022 lines) with all UI text hardcoded in Ukrainian. No internationalization system exists. The header has a logo, title, role badge, and login/logout button.

## Requested Changes (Diff)

### Add
- `src/frontend/src/i18n.ts` — translations object with `uk` (Ukrainian) and `en` (English) for all UI strings
- `src/frontend/src/hooks/useLanguage.ts` — context + hook for language state (persisted to localStorage, default `uk`)
- Language toggle button in the header (between the loading spinner and auth buttons): shows "EN" when current is `uk`, shows "УКР" when current is `en`

### Modify
- `App.tsx` — import `useLanguage` hook and `t` translation function; replace every hardcoded Ukrainian string with `t('key')` calls
- `formatTimestamp` — accept language param and return localized relative time strings

### Remove
- Nothing

## Implementation Plan
1. Create `i18n.ts` with full `uk`/`en` translation map covering all visible strings in the app
2. Create `useLanguage.ts` hook with React context, localStorage persistence, default `uk`
3. In `App.tsx`: wrap app with `LanguageProvider`, use `useLanguage()` to get `t()` function, add language toggle button in header, replace all hardcoded strings
4. `formatTimestamp` should receive language and use localized time words
5. Pass `lang` down to components that use `formatTimestamp` or contain hardcoded strings
