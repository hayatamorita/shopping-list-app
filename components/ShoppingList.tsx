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
  return (
    <ul className="space-y-3">
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