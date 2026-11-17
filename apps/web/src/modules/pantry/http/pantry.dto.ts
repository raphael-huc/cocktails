import { z } from "zod";

export const pantryItemDto = z.object({
  ingredient: z.string(),
});
