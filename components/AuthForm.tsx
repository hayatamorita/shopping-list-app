"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onLoggedIn: () => void;
};

export default function AuthForm({ onLoggedIn }: Props) {
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<
    "error" | "success" | ""
  >("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email.trim() || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      setMessageKind("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageKind("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageKind("error");
      setLoading(false);
      return;
    }

    // Confirm email がOFFの場合は、その場でSessionが作成される
    if (data.session) {
      setMessage("アカウントを作成しました");
      setMessageKind("success");
      setLoading(false);
      onLoggedIn();
      return;
    }

    // Confirm email がONの場合
    setMessage(
      "確認メールを送信しました。メール内のリンクを開いて、メールアドレスの確認を完了してください。確認後、この画面からログインできます。"
    );
    setMessageKind("success");
    setPassword("");
    setLoading(false);
  }

  async function login() {
    if (!email.trim() || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      setMessageKind("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageKind("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageKind("error");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLoggedIn();
  }

  return (
    <main className="flex min-h-dvh items-center px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
          買いもの帳
        </h1>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void login();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-ink"
            >
              メールアドレス
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-pine focus:border-pine focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-ink"
            >
              パスワード
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-pine focus:border-pine focus:outline-none"
            />
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full rounded-xl bg-pine px-5 font-semibold text-white transition-colors hover:bg-pine-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>

            <button
              type="button"
              onClick={() => void signUp()}
              disabled={loading}
              className="min-h-11 w-full rounded-xl border border-line bg-transparent px-5 font-semibold text-ink transition-colors hover:border-pine hover:text-pine disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "処理中..." : "新規登録"}
            </button>
          </div>

          {message && (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
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
        </form>
      </section>
    </main>
  );
}