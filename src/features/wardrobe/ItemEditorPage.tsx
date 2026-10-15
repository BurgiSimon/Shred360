import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useItem } from '@/data/hooks';
import { getCategory, isCategoryId, type CategoryId } from '@/domain/categories';
import { createItem, itemDisplayName } from '@/domain/items';
import { EmptyState } from '@/ui/EmptyState';
import { PageHeader } from '@/ui/PageHeader';
import { RouteFallback } from '@/ui/RouteFallback';
import { CategoryPicker } from './CategoryPicker';
import { ItemForm } from './ItemForm';

/**
 * Form pages are keyed by the location so every navigation starts from a fresh draft. Without
 * this, React Router's transition-wrapped navigations can skip committing the page in between
 * (e.g. new → detail → new) and the old draft, including its id, would be reused.
 */
export function NewItemPage() {
  const location = useLocation();
  // Hash navigations made outside the router all share the key "default", so add the search too.
  return <NewItemFlow key={`${location.key}${location.search}`} />;
}

export function EditItemPage() {
  const location = useLocation();
  return <EditItemFlow key={`${location.key}${location.pathname}`} />;
}

function NewItemFlow() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const fromQuery = params.get('category');
  const categoryId: CategoryId | undefined = isCategoryId(fromQuery) ? fromQuery : undefined;
  // Created once per mount so the draft id stays stable while editing, and replaced right after a
  // save so this page can never write a second item over the one it just created.
  const [initial, setInitial] = useState(() => (categoryId ? createItem(categoryId) : undefined));

  if (!initial) {
    return (
      <>
        <PageHeader title="Add gear" subtitle="What are you adding?" back="/wardrobe" />
        <div className="px-4 sm:px-6">
          <CategoryPicker onPick={(id) => setParams({ category: id })} />
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
        onSaved={(item) => {
          setInitial(createItem(item.categoryId));
          navigate(`/wardrobe/${item.id}`, { replace: true });
        }}
        onCancel={() => navigate('/wardrobe')}
      />
    </>
  );
}

function EditItemFlow() {
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
