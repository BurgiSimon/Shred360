import { getCategory } from '@/domain/categories';
import { itemCoverPhotoId, itemDisplayName } from '@/domain/items';
import type { Item } from '@/domain/types';
import { PhotoImage } from './PhotoImage';

/** Square image of an item: its cover photo, or a colour tile with the category icon. */
export function ItemThumb({ item, className = '' }: { item: Item; className?: string }) {
  const category = getCategory(item.categoryId);
  const fallback = (
    <div
      className={`flex items-center justify-center text-3xl ${className}`}
      style={{
        background: `linear-gradient(135deg, ${item.colors.primary}, ${item.colors.secondary ?? item.colors.primary})`,
      }}
      aria-hidden
    >
      <span className="drop-shadow">{category?.icon}</span>
    </div>
  );
  return (
    <PhotoImage
      photoId={itemCoverPhotoId(item)}
      alt={itemDisplayName(item)}
      className={`object-cover ${className}`}
      fallback={fallback}
    />
  );
}
