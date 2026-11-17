import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  changeLocale,
  contentLanguageOf,
  type Locale,
  localeOfContentLanguage,
} from "@/shared/i18n";
import type { User } from "../domain/user";
import { updateLanguage } from "../http/auth.repository";
import { sessionQueryKey } from "./session.queries";

/**
 * Puts the interface in the language saved on the account, so the choice
 * follows the user from one device to another. An account that never chose
 * keeps whatever this browser uses.
 */
export function followAccountLanguage(user: User): void {
  const locale = localeOfContentLanguage(user.language);
  if (locale) changeLocale(locale);
}

/**
 * Changes the language of the interface.
 *
 * Signed in, the choice is saved on the account first: switching reloads the
 * page, which would cut the request short. If saving fails, this browser still
 * switches; the account simply keeps its previous language.
 */
export function useChangeLanguage({ saveToAccount }: { saveToAccount: boolean }) {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (locale: Locale) => updateLanguage(contentLanguageOf(locale)),
    onSuccess: (_data, locale) => {
      queryClient.setQueryData<User | null>(sessionQueryKey, (user) =>
        user ? { ...user, language: contentLanguageOf(locale) } : user,
      );
    },
    onSettled: (_data, _error, locale) => changeLocale(locale),
  });

  return {
    isPending: save.isPending,
    changeLanguage: (locale: Locale) => {
      if (saveToAccount) save.mutate(locale);
      else changeLocale(locale);
    },
  };
}
