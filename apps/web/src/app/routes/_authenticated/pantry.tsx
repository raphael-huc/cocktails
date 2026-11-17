import { createFileRoute } from "@tanstack/react-router";
import { PantryScreen, PantrySkeleton } from "@/modules/pantry";

export const Route = createFileRoute("/_authenticated/pantry")({
  component: PantryScreen,
  pendingComponent: PantrySkeleton,
});
