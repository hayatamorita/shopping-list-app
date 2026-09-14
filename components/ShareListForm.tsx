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
  const [messageKind, setMessageKind] = useState<"error" | "success" | "">("");
  const [loading, setLoading] = useState(false);

  async function shareList() {
    const targetEmail = email.trim();

    if (targetEmail === "") return;

    setLoading(true);
    setMessage("");
    setMessageKind("");

    const { error } = await supabase.rpc(
      "add_list_member_by_email",
      {
        target_list_id: listId,
        target_email: targetEmail,
      }
    );

    if (error) {
      setMessage(error.message);
      setMessageKind("error");
    } else {
      setEmail("");
      setMessage("共有メンバーに追加しました");
      setMessageKind("success");
    }

    setLoading(false);
  }

  return (
    <section className="mt-6 border-t border-line pt-5" aria-labelledby="share-list-title">
      <h3 id="share-list-title" className="mb-3 text-base font-semibold text-ink">
        共有
      </h3>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void shareList();
        }}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="share-email" className="sr-only">
            共有する相手のメールアドレス
          </label>
          <input
            id="share-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="相手のメールアドレス"
            className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-pine focus:border-pine focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-xl border border-pine bg-transparent px-5 font-semibold text-pine transition-colors hover:bg-sage disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
        >
          {loading ? "追加中..." : "共有"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-sm ${
            messageKind === "error"
              ? "bg-error-surface text-vermillion"
              : "bg-sage text-ink"
          }`}
          role={messageKind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </section>
  );
}
