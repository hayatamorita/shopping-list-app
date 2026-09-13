"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  listId: string;
};

export default function ShareListForm({
  listId,
}: Props) {
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function shareList() {
    const targetEmail = email.trim();

    if (targetEmail === "") return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "add_list_member_by_email",
      {
        target_list_id: listId,
        target_email: targetEmail,
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setEmail("");
      setMessage("共有メンバーに追加しました");
    }

    setLoading(false);
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="mb-3 font-bold">
        リストを共有
      </h3>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="相手のメールアドレス"
          className="flex-1 rounded border p-2"
        />

        <button
          onClick={shareList}
          disabled={loading}
          className="rounded bg-gray-800 px-4 py-2 text-white"
        >
          {loading ? "追加中..." : "共有"}
        </button>
      </div>

      {message && (
        <p className="mt-2 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}