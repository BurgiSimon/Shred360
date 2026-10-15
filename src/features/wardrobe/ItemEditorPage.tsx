import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useItem } from '@/data/hooks';
import { getCategory, isCategoryId, type CategoryId } from '@/domain/categories';
import { createItem, itemDisplayName } from '@/domain/items';
import { EmptyState } from '@/ui/EmptyState';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { CategoryPicker } from './CategoryPicker';
import { ItemForm } from './ItemForm';

export function NewItemPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromQuery = params.get('category');
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>(
    isCategoryId(fromQuery) ? fromQuery : undefined,
  );
  // Created once per chosen category so the draft id stays stable while editing.
  const initial = useMemo(() => (categoryId ? createItem(categoryId) : undefined), [categoryId]);

  if (!initial) {
    return (
      <>
        <PageHeader title="Add gear" subtitle="What are you adding?" back="/wardrobe" />
        <div className="px-4 sm:px-6">
          <CategoryPicker onPick={setCategoryId} />
        </div>
      </>
    );
  }

  const category = getCategory(initial.categoryId);
  return (
    <>
      <PageHeader title={`New ${category?.label.toLowerCase() ?? 'item'}`} back="/wardrobe" />
      <ItemForm
        key={initial.id}
        initial={initial}
        isNew
        onSaved={(item) => navigate(`/wardrobe/${item.id}`, { replace: true })}
        onCancel={() => navigate('/wardrobe')}
      />
    </>
  );
}

export function EditItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, loading } = useItem(id);
  // Freeze the item we started editing so background writes don't reset the form.
  const [initial, setInitial] = useState(item);
  if (item && !initial) setInitial(item);

  if (loading && !initial) return <RouteFallback />;
  if (!initial) return <EmptyState icon="🤷" title="That item doesn't exist anymore" />;

  return (
    <>
      <PageHeader title={`Edit ${itemDisplayName(initial)}`} back />
      <ItemForm
        initial={initial}
        isNew={false}
        onSaved={(saved) => navigate(`/wardrobe/${saved.id}`, { replace: true })}
        onCancel={() => navigate(-1)}
      />
    </>
  );
}
