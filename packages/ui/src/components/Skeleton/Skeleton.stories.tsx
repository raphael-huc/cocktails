import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  args: { className: "h-6 w-48" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single block, sized by the caller. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Decorative: assistive technologies must not announce each grey block.
    await expect(canvasElement.querySelector("[aria-hidden='true']")).not.toBeNull();
  },
};

/** Blocks composed into the shape of the content they stand for, with one text alternative. */
export const ComposedAsCard: Story = {
  render: () => (
    <div className="flex w-80 items-start gap-4 rounded-card border border-line bg-surface p-5">
      <p role="status" className="sr-only">
        Loading…
      </p>
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="size-18 rounded-card" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("Loading…");
  },
};
