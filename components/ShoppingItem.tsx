type Item = {
  id: string;
  name: string;
  checked: boolean;
};

type Props = {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ShoppingItem({
  item,
  onToggle,
  onDelete,
}: Props) {
  return (
    <li className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3 transition-colors hover:border-pine sm:px-4">
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          className="h-5 w-5 shrink-0 accent-pine"
        />

        <span
          className={`min-w-0 flex-1 break-words text-base leading-5 ${
            item.checked ? "text-muted line-through" : "text-ink"
          }`}
        >
          {item.name}
          <span className="sr-only">
            {item.checked ? "（購入済み）" : "（未購入）"}
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        aria-label={`${item.name}を削除`}
        className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-vermillion transition-colors hover:bg-error-surface"
      >
        削除
      </button>
    </li>
  );
}
