import { Select } from "@cocktails/ui";
import { getLocale, LANGUAGES, type Locale, m } from "@/shared/i18n";
import { useChangeLanguage } from "../application/account-language";

export type LanguageSwitcherProps = {
  /**
   * Whether the choice is also saved on the signed-in account. Leave it off
   * where nobody is signed in, such as the sign-in page: the choice is then
   * kept in the browser only.
   */
  saveToAccount?: boolean;
};

export function LanguageSwitcher({ saveToAccount = false }: LanguageSwitcherProps) {
  const { changeLanguage, isPending } = useChangeLanguage({ saveToAccount });

  return (
    <Select
      label={m.language_label()}
      hideLabel
      value={getLocale()}
      disabled={isPending}
      onValueChange={(locale) => changeLanguage(locale as Locale)}
      options={LANGUAGES.map((language) => ({ value: language.locale, label: language.name }))}
    />
  );
}
