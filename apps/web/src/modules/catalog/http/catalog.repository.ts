import { readItems } from "@directus/sdk";
import { z } from "zod";
import { parseResponse, send } from "@/shared/http/request";
import { languagesToFetch } from "@/shared/http/translations";
import type { Cocktail } from "../domain/cocktail";
import type { Ingredient } from "../domain/ingredient";
import { cocktailDto, ingredientDto } from "./catalog.dto";
import { toCocktail, toIngredient } from "./catalog.mapper";

export async function fetchIngredients(language: string): Promise<Ingredient[]> {
  const data = await send(
    readItems("ingredient", {
      fields: ["id", "category", "parent", { translations: ["languages_code", "name"] }],
      deep: {
        translations: { _filter: { languages_code: { _in: languagesToFetch(language) } } },
      },
      limit: -1,
    }),
  );

  return parseResponse(z.array(ingredientDto), data).map((dto) => toIngredient(dto, language));
}

export async function fetchCocktails(language: string): Promise<Cocktail[]> {
  const data = await send(
    readItems("cocktail", {
      fields: [
        "id",
        "name",
        "category",
        "source",
        "glass",
        "tint",
        "image",
        { translations: ["languages_code", "description", "steps"] },
        { ingredients: ["ingredient", "amount", "unit", "optional", "garnish", "note", "sort"] },
      ],
      // Drafts are recipes the import could not read completely.
      filter: { status: { _eq: "published" } },
      deep: {
        translations: { _filter: { languages_code: { _in: languagesToFetch(language) } } },
      },
      sort: ["name"],
      limit: -1,
    }),
  );

  return parseResponse(z.array(cocktailDto), data).map((dto) => toCocktail(dto, language));
}
