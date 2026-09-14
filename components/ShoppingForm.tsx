"use client";

import { useState } from "react";

type Props = {
  onAdd: (name: string) => Promise<void>;
};

export default function ShoppingForm({ onAdd }: Props) {
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const name = input.trim();

    if (name === "" || adding) return;

    setAdding(true);

    await onAdd(name);

    setInput("");
    setAdding(false);
  }

  return (
    <form
      className="mb-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleAdd();
      }}
    >
      <label htmlFor="shopping-item" className="mb-1.5 block text-sm font-semibold text-ink">
        商品
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="shopping-item"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例：牛乳"
          disabled={adding}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-pine focus:border-pine focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={adding}
          className="min-h-11 rounded-xl bg-pine px-5 font-semibold text-white transition-colors hover:bg-pine-strong disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
        >
          {adding ? "追加中..." : "追加"}
        </button>
      </div>
    </form>
  );
}
