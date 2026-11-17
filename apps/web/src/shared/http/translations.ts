import { BASE_CONTENT_LANGUAGE } from "@/shared/i18n";

/** Languages to request: the wanted one, and the base language as a fallback. */
export function languagesToFetch(language: string): string[] {
  return language === BASE_CONTENT_LANGUAGE ? [language] : [language, BASE_CONTENT_LANGUAGE];
}

/** The translation in the wanted language, else the one in the base language. */
export function pickTranslation<T extends { languages_code: string }>(
  translations: readonly T[],
  language: string,
): T | undefined {
  return (
    translations.find((translation) => translation.languages_code === language) ??
    translations.find((translation) => translation.languages_code === BASE_CONTENT_LANGUAGE)
  );
}
