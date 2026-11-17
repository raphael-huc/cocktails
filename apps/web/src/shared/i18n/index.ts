import { getLocale, type Locale, setLocale } from "./paraglide/runtime.js";

export { m } from "./paraglide/messages.js";
export { getLocale, type Locale };

/**
 * Each language of the interface, with the Directus language its content is
 * read in and its own name (never translated: it is how its speakers find it).
 *
 * Typed by `Locale`: adding a language to `project.inlang/settings.json`
 * without describing it here is a compile error.
 */
const LANGUAGE_DETAILS: Record<Locale, { contentLanguage: string; name: string }> = {
  en: { contentLanguage: "en-US", name: "English" },
  fr: { contentLanguage: "fr-FR", name: "Français" },
};

/** Code of the language Directus content falls back to when a translation is missing. */
export const BASE_CONTENT_LANGUAGE = LANGUAGE_DETAILS.en.contentLanguage;

/** The languages a user can choose from. */
export const LANGUAGES = (Object.keys(LANGUAGE_DETAILS) as Locale[]).map((locale) => ({
  locale,
  ...LANGUAGE_DETAILS[locale],
}));

export function contentLanguageOf(locale: Locale): string {
  return LANGUAGE_DETAILS[locale].contentLanguage;
}

/** Directus language code matching the locale currently used by the interface. */
export function getContentLanguage(): string {
  return contentLanguageOf(getLocale());
}

/** The interface language for a Directus language code, if the application has it. */
export function localeOfContentLanguage(code: string | null | undefined): Locale | undefined {
  return LANGUAGES.find((language) => language.contentLanguage === code)?.locale;
}

/**
 * Switches the interface to another language and remembers it in this
 * browser. The page reloads, so that every text and every request follows.
 * Does nothing when the language is already the current one.
 */
export function changeLocale(locale: Locale): void {
  if (locale !== getLocale()) void setLocale(locale);
}
