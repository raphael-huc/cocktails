import { z } from "zod";

export const userDto = z.object({
  id: z.string(),
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  // Absent when the role may not read it: treated as "not chosen".
  language: z.string().nullish(),
});

export type UserDto = z.output<typeof userDto>;
