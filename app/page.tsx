"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import AuthForm from "@/components/AuthForm";
import ShoppingForm from "@/components/ShoppingForm";
import ShoppingList from "@/components/ShoppingList";
import ShareListForm from "@/components/ShareListForm";

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
      <main className="p-8">
        読み込み中...
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
    <main className="mx-auto max-w-md p-8">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            買い物リスト
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {user.email}
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded border px-3 py-2"
        >
          ログアウト
        </button>

      </div>

      {error && (
        <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {dbLoading ? (
        <p>読み込み中...</p>
      ) : lists.length === 0 ? (

        <div className="space-y-3">

          <input
            type="text"
            value={newListName}
            onChange={(e) =>
              setNewListName(e.target.value)
            }
            onKeyDown={(e) => {

              if (
                e.nativeEvent.isComposing
              ) {
                return;
              }

              if (e.key === "Enter") {
                e.preventDefault();
                createShoppingList();
              }

            }}
            placeholder="例：スーパー用"
            className="w-full rounded border p-2"
          />

          <button
            onClick={createShoppingList}
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            買い物リストを作成
          </button>

        </div>

      ) : (
        <>

          <div className="mb-6">

            <label className="mb-2 block text-sm font-bold">
              買い物リスト
            </label>

            <select
              value={selectedListId ?? ""}
              onChange={(e) =>
                selectList(e.target.value)
              }
              className="w-full rounded border p-2"
            >
              {lists.map((list) => (
                <option
                  key={list.id}
                  value={list.id}
                >
                  {list.name}
                  {list.owner_id === user.id
                    ? "（自分）"
                    : "（共有）"}
                </option>
              ))}
            </select>

          </div>

          {selectedList && (
            <>
              <h2 className="mb-4 text-xl font-bold">
                {selectedList.name}
              </h2>

              <ShoppingForm
                onAdd={addItem}
              />

              <ShoppingList
                items={items}
                onToggle={toggleItem}
                onDelete={deleteItem}
              />

              {selectedList.owner_id ===
                user.id && (
                <ShareListForm
                  listId={
                    selectedList.id
                  }
                />
              )}
            </>
          )}

        </>
      )}

    </main>
  );
}