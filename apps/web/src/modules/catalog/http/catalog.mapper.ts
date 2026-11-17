import { assetUrl } from "@/shared/http/assets";
import { pickTranslation } from "@/shared/http/translations";
import type { Cocktail } from "../domain/cocktail";
import type { Ingredient } from "../domain/ingredient";
import type { CocktailDto, IngredientDto } from "./catalog.dto";

/** Where the established recipes come from: the official IBA list and our own seed. */
const CLASSIC_SOURCES = new Set(["iba", "seed"]);

export function toIngredient(dto: IngredientDto, language: string): Ingredient {
  return {
    id: dto.id,
    name: pickTranslation(dto.translations, language)?.name ?? dto.id,
    category: dto.category,
    parentId: dto.parent,
  };
}

export function toCocktail(dto: CocktailDto, language: string): Cocktail {
  const translation = pickTranslation(dto.translations, language);

  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    classic: dto.source !== null && CLASSIC_SOURCES.has(dto.source),
    description: translation?.description ?? null,
    glass: dto.glass,
    tint: dto.tint,
    imageUrl: dto.image ? assetUrl(dto.image, "cocktail-photo") : null,
    thumbnailUrl: dto.image ? assetUrl(dto.image, "cocktail-thumbnail") : null,
    steps: translation?.steps?.map((step) => step.text) ?? [],
    ingredients: dto.ingredients
      .toSorted((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((line) => ({
        ingredientId: line.ingredient,
        amount: line.amount,
        unit: line.unit,
        optional: line.optional,
        garnish: line.garnish,
        note: line.note,
      })),
  };
}
