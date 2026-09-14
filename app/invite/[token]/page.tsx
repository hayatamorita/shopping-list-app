"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import AuthForm from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const redeemStarted = useRef(false);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setLoading(false);
  }

  useEffect(() => {
    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user || !token) return;
    if (redeemStarted.current) return;

    redeemStarted.current = true;

    async function redeem() {
      const { error } = await supabase.rpc(
        "redeem_invite",
        {
          invite_token: token,
        }
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setSuccess(true);
      setMessage(
        "共有リストに参加しました。"
      );
    }

    void redeem();
  }, [user, token, supabase]);

  if (loading) {
    return (
      <main className="p-8">
        読み込み中...
      </main>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onLoggedIn={getCurrentUser}
        title="共有リストに招待されています"
        description="参加するにはログイン、または新規登録してください。"
      />
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">
        招待
      </h1>

      {message && (
        <p
          className={`mt-4 rounded p-4 ${
            success
              ? "bg-green-50"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {success && (
        <a
          href="/"
          className="mt-6 inline-block rounded bg-blue-500 px-4 py-2 text-white"
        >
          買い物リストを開く
        </a>
      )}
    </main>
  );
}