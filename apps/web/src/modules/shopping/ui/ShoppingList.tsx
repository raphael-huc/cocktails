import { Badge, Button, TextField } from "@cocktails/ui";
import type { FormEvent } from "react";
import { m } from "@/shared/i18n";
import type { ShoppingEntry } from "../domain/shopping-list";

export type ShoppingListProps = {
  entries: readonly ShoppingEntry[];
  /** The ingredient was bought: it joins the bar and leaves the list. */
  onBought: (ingredientId: string) => void;
  onRemove: (id: string) => void;
  /**
   * Adds something in the user's own words. Returns whether it was accepted,
   * so the field is only emptied when there was something to add.
   */
  onAdd: (label: string) => boolean;
  adding?: boolean;
};

export function ShoppingList({
  entries,
  onBought,
  onRemove,
  onAdd,
  adding = false,
}: ShoppingListProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const label = String(new FormData(form).get("label") ?? "");
    if (onAdd(label)) form.reset();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <TextField
          label={m.shopping_add_item_label()}
          name="label"
          autoComplete="off"
          maxLength={120}
          className="w-full max-w-sm"
        />
        <Button type="submit" variant="secondary" className="h-11" disabled={adding}>
          {m.shopping_add_item_submit()}
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="max-w-prose text-ink-muted">{m.shopping_empty()}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <span className={`flex-1 text-lg ${entry.owned ? "text-ink-muted" : ""}`}>
                {entry.name}
              </span>
              {entry.owned ? <Badge tone="accent">{m.shopping_in_bar()}</Badge> : null}
              {/* Only an ingredient can join the bar; anything else is just removed. */}
              {entry.ingredientId && !entry.owned ? (
                <Button
                  size="sm"
                  aria-label={m.shopping_bought_named({ name: entry.name })}
                  onClick={() => entry.ingredientId && onBought(entry.ingredientId)}
                >
                  {m.shopping_bought()}
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                aria-label={m.shopping_remove_named({ name: entry.name })}
                onClick={() => onRemove(entry.id)}
              >
                {m.shopping_remove()}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
