import ShoppingItem from "./ShoppingItem";

type Item = {
  id: string;
  name: string;
  checked: boolean;
};

type Props = {
  items: Item[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ShoppingList({
  items,
  onToggle,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper px-4 py-5 text-center">
        <p className="text-sm text-muted">商品はまだありません</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="商品一覧">
      {items.map((item) => (
        <ShoppingItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
