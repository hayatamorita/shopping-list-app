"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  listId: string;
};

type Invite = {
  token: string;
  expires_at: string;
};

export default function InviteLinkForm({
  listId,
}: Props) {
  const [supabase] = useState(() => createClient());

  const [inviteUrl, setInviteUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createInvite() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc(
      "create_invite_link",
      {
        target_list_id: listId,
      }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const invite = data?.[0] as Invite | undefined;

    if (!invite) {
      setMessage("招待リンクを作成できませんでした");
      setLoading(false);
      return;
    }

    const url =
      `${window.location.origin}/invite/${invite.token}`;

    setInviteUrl(url);
    setExpiresAt(invite.expires_at);
    setLoading(false);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setMessage("招待リンクをコピーしました");
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="mb-2 font-bold">
        招待リンク
      </h3>

      <p className="mb-3 text-sm text-gray-500">
        リンクは24時間有効で、1人だけ使用できます。
      </p>

      <button
        onClick={createInvite}
        disabled={loading}
        className="rounded bg-gray-800 px-4 py-2 text-white"
      >
        {loading
          ? "作成中..."
          : "招待リンクを作成"}
      </button>

      {inviteUrl && (
        <div className="mt-4 space-y-2">
          <input
            readOnly
            value={inviteUrl}
            className="w-full rounded border p-2 text-sm"
          />

          <button
            onClick={copyInvite}
            className="rounded border px-4 py-2"
          >
            コピー
          </button>

          <p className="text-xs text-gray-500">
            有効期限：
            {new Date(expiresAt).toLocaleString()}
          </p>
        </div>
      )}

      {message && (
        <p className="mt-2 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}