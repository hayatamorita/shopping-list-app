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
    <li className="flex items-center gap-3 rounded border p-3">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
      />

      <span
        className={`flex-1 ${
          item.checked ? "text-gray-400 line-through" : ""
        }`}
      >
        {item.name}
      </span>

      <button
        onClick={() => onDelete(item.id)}
        className="text-red-500"
      >
        削除
      </button>
    </li>
  );
}