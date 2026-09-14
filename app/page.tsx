"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import AuthForm from "@/components/AuthForm";
import ShoppingForm from "@/components/ShoppingForm";
import ShoppingList from "@/components/ShoppingList";
import ShareListForm from "@/components/ShareListForm";
import InviteLinkForm from "@/components/InviteLinkForm";

import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  name: string;
  checked: boolean;
};

type ShoppingListData = {
  id: string;
  name: string;
  owner_id: string;
};

export default function Home() {
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [selectedListId, setSelectedListId] =
    useState<string | null>(null);

  const [newListName, setNewListName] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedList =
    lists.find((list) => list.id === selectedListId) ?? null;

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setAuthLoading(false);
  }

  useEffect(() => {
    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      loadLists();
    } else {
      setLists([]);
      setSelectedListId(null);
      setItems([]);
    }
  }, [user]);


  useEffect(() => {
    if (!user || !selectedListId) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function refreshItems() {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("id, name, checked")
        .eq("list_id", selectedListId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        return;
      }

      setItems(data ?? []);
    }

    async function setupRealtime() {
      await supabase.realtime.setAuth();

      if (cancelled) return;

      channel = supabase
        .channel(`shopping-list:${selectedListId}`, {
          config: {
            private: true,
          },
        })
        .on(
          "broadcast",
          { event: "INSERT" },
          refreshItems
        )
        .on(
          "broadcast",
          { event: "UPDATE" },
          refreshItems
        )
        .on(
          "broadcast",
          { event: "DELETE" },
          refreshItems
        )
        .subscribe((status) => {
          console.log("Realtime:", status);
        });
    }

    setupRealtime();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, selectedListId, supabase]);

  async function loadLists() {
    setDbLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id, name, owner_id")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setDbLoading(false);
      return;
    }

    const loadedLists = data ?? [];

    setLists(loadedLists);

    if (loadedLists.length === 0) {
      setSelectedListId(null);
      setItems([]);
      setDbLoading(false);
      return;
    }

    const firstList = loadedLists[0];

    setSelectedListId(firstList.id);

    await loadItems(firstList.id);

    setDbLoading(false);
  }

  async function loadItems(listId: string) {
    setError("");

    const { data, error } = await supabase
      .from("shopping_items")
      .select("id, name, checked")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setItems(data ?? []);
  }

  async function selectList(listId: string) {
    setSelectedListId(listId);
    setItems([]);

    await loadItems(listId);
  }

  async function createShoppingList() {
    if (!user) return;

    const name = newListName.trim();

    if (name === "") {
      setError("リスト名を入力してください");
      return;
    }

    setError("");

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      setError("ログイン情報を取得できません");
      return;
    }

    const newListId = crypto.randomUUID();

    const { error } = await supabase
      .from("shopping_lists")
      .insert({
        id: newListId,
        name,
        owner_id: currentUser.id,
      });

    if (error) {
      setError(error.message);
      return;
    }

    const newList: ShoppingListData = {
      id: newListId,
      name,
      owner_id: currentUser.id,
    };

    setLists((current) => [
      ...current,
      newList,
    ]);

    setSelectedListId(newListId);
    setNewListName("");
    setItems([]);
  }

  async function addItem(name: string) {
    if (!selectedListId) return;

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        list_id: selectedListId,
        name,
      })
      .select("id, name, checked")
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setItems((current) => [...current, data]);
  }

  async function toggleItem(id: string) {
    const item = items.find(
      (item) => item.id === id
    );

    if (!item) return;

    const newChecked = !item.checked;

    const { error } = await supabase
      .from("shopping_items")
      .update({
        checked: newChecked,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: newChecked,
            }
          : item
      )
    );
  }

  async function deleteItem(id: string) {
    const item = items.find((current) => current.id === id);

    if (!item || !window.confirm(`「${item.name}」を削除しますか？`)) {
      return;
    }

    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setItems((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setLists([]);
    setSelectedListId(null);
    setItems([]);
  }

  if (authLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-8">
        <p className="text-sm text-muted" role="status">
          読み込み中...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onLoggedIn={getCurrentUser}
      />
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              買いもの帳
            </h1>
            <p className="mt-1 max-w-prose break-all text-xs text-muted">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-pine hover:text-pine"
          >
            ログアウト
          </button>
        </header>

        {error && (
          <div
            className="mb-5 rounded-2xl border border-vermillion/30 bg-error-surface px-4 py-3 text-sm text-vermillion"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
          {dbLoading ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              <div className="h-4 w-24 rounded-full bg-line/70" />
              <div className="h-12 rounded-xl bg-line/50" />
              <p className="text-sm text-muted">リストを読み込み中...</p>
            </div>
          ) : lists.length === 0 ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void createShoppingList();
              }}
            >
              <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                新しいリスト
              </h2>

              <div className="space-y-2">
                <label
                  htmlFor="new-list-name"
                  className="block text-sm font-semibold text-ink"
                >
                  リスト名
                </label>
                <input
                  id="new-list-name"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="例：週末"
                  className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink placeholder:text-muted/70 transition-colors hover:border-pine focus:border-pine focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="min-h-11 w-full rounded-xl bg-pine px-5 font-semibold text-white transition-colors hover:bg-pine-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                作成
              </button>
            </form>
          ) : (
            <>
              <section aria-labelledby="list-selector-title" className="mb-6">
                <label
                  id="list-selector-title"
                  htmlFor="list-selector"
                  className="mb-2 block text-sm font-semibold text-ink"
                >
                  リスト
                </label>
                <select
                  id="list-selector"
                  value={selectedListId ?? ""}
                  onChange={(e) => void selectList(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-base text-ink transition-colors hover:border-pine focus:border-pine focus:outline-none"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                      {list.owner_id === user.id ? "（自分）" : "（共有）"}
                    </option>
                  ))}
                </select>
              </section>

              {selectedList && (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                      {selectedList.name}
                    </h2>
                  </div>

                  <ShoppingForm onAdd={addItem} />

                  <ShoppingList
                    items={items}
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                  />

                  {selectedList.owner_id === user.id && (
                    <InviteLinkForm listId={selectedList.id} />
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
