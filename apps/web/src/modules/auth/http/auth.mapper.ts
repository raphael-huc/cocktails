import type { User } from "../domain/user";
import type { UserDto } from "./auth.dto";

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    language: dto.language ?? null,
  };
}
