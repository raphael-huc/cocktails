import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const translations: Record<string, Record<string, string>> = { fr };

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort();
}

describe.each(Object.entries(translations))("the %s messages", (_locale, messages) => {
  it("translate every message of the base language, and nothing else", () => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
  });

  it("use the same parameters as the base language", () => {
    for (const [key, message] of Object.entries(en)) {
      if (key === "$schema") continue;
      expect(placeholders(messages[key] ?? ""), key).toEqual(placeholders(message));
    }
  });

  it("leave no message empty", () => {
    for (const [key, message] of Object.entries(messages)) {
      expect(message.trim(), key).not.toBe("");
    }
  });
});
