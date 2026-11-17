import { createFileRoute } from "@tanstack/react-router";
import { ShoppingListScreen } from "@/modules/shopping";

export const Route = createFileRoute("/_authenticated/shopping")({
  component: ShoppingListScreen,
});
