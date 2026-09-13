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
    <div className="mb-6 flex gap-2">
     <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;

            if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
            }
        }}
        placeholder="商品を入力"
        disabled={adding}
        className="flex-1 rounded border p-2"
    /> 

      <button
        onClick={handleAdd}
        disabled={adding}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {adding ? "追加中..." : "追加"}
      </button>
    </div>
  );
}