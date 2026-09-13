"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onLoggedIn: () => void;
};

export default function AuthForm({ onLoggedIn }: Props) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("サインアップしました");
      onLoggedIn();
    }

    setLoading(false);
  }

  async function login() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      onLoggedIn();
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-3xl font-bold">
        買い物リスト
      </h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full rounded bg-blue-500 p-2 text-white"
        >
          ログイン
        </button>

        <button
          onClick={signUp}
          disabled={loading}
          className="w-full rounded border p-2"
        >
          新規登録
        </button>

        {message && (
          <p className="text-sm">{message}</p>
        )}
      </div>
    </main>
  );
}