"use client"; // needs state for the drawer form, the delete dialog and the inline order inputs

import { Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import type { ActionResult } from "@/lib/admin/result";
import { LIMITS, parseCategory, slugify, type CategoryFormValues, type FieldErrors } from "@/lib/admin/courses-schema";
import ConfirmDialog from "./ConfirmDialog";
import Drawer from "./Drawer";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

const EMPTY: CategoryFormValues = { name: "", slug: "", description: "", order: "0" };

type Editing = { mode: "create" } | { mode: "edit"; id: string };

/** A category as the manager shows it; `count` is how many courses or posts use it. */
export type ManagedCategory = { id: string; name: string; slug: string; description: string; order: number; count: number };

/** The four Server Actions of a category set, passed in by the page (courses: specs/025, blog: specs/033-admin-blog research R11). */
export type CategoryActions = {
  create: (values: CategoryFormValues) => Promise<ActionResult<{ id: string; slug: string }>>;
  update: (input: { id: string; values: CategoryFormValues }) => Promise<ActionResult>;
  setOrder: (input: { id: string; order: number }) => Promise<ActionResult>;
  remove: (input: { id: string }) => Promise<ActionResult>;
};

const countText = (n: number, noun: readonly [string, string]) => `${n} ${n === 1 ? noun[0] : noun[1]}`;

/** One row's display-order box: saves on blur or Enter, puts the old number back if the save fails. */
function OrderInput({ category, setOrder }: { category: ManagedCategory; setOrder: CategoryActions["setOrder"] }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [value, setValue] = useState(String(category.order));
  const [pending, start] = useTransition();

  const save = () => {
    const order = Number(value.trim());
    if (value.trim() === String(category.order)) return;
    if (value.trim() === "" || !Number.isInteger(order) || Math.abs(order) > LIMITS.order) {
      toast.error(`Enter a whole number between -${LIMITS.order} and ${LIMITS.order}.`);
      setValue(String(category.order));
      return;
    }
    start(async () => {
      const result = await setOrder({ id: category.id, order });
      if (result.ok) {
        toast.success(`Order saved for “${category.name}”`);
        router.refresh();
      } else {
        setValue(String(category.order));
        fail(result, "save the order");
      }
    });
  };

  return (
    <label className="flex items-center gap-2 text-sm text-midnight/80">
      <span>Order</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        disabled={pending}
        aria-label={`Display order for ${category.name}`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        className="h-11 w-20 rounded-xl border border-midnight/25 bg-white px-3 text-midnight focus-visible:outline-2 focus-visible:outline-royal disabled:opacity-60"
      />
    </label>
  );
}

/** The categories list with create/edit (in a drawer), inline display order and a guarded delete. */
export default function CategoryManager({
  categories,
  actions,
  noun,
  basePath,
  withDescription,
}: {
  categories: ManagedCategory[];
  actions: CategoryActions;
  /** singular and plural of what a category holds, e.g. ["course", "courses"] */
  noun: readonly [string, string];
  /** the public list a category filters, e.g. "/courses" */
  basePath: string;
  withDescription: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [values, setValues] = useState<CategoryFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, startSaving] = useTransition();
  const [toDelete, setToDelete] = useState<ManagedCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const openCreate = () => {
    setValues(EMPTY);
    setErrors({});
    setSlugTouched(false);
    setEditing({ mode: "create" });
  };

  const openEdit = (c: ManagedCategory) => {
    setValues({ name: c.name, slug: c.slug, description: c.description, order: String(c.order) });
    setErrors({});
    setSlugTouched(true); // an existing address never changes by itself
    setEditing({ mode: "edit", id: c.id });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = { ...values, slugAuto: editing.mode === "create" && !slugTouched };
    const parsed = parseCategory(payload);
    if (!parsed.success) {
      setErrors(parsed.errors);
      const first = ["name", "slug", "description", "order"].find((k) => parsed.errors[k]);
      if (first) window.requestAnimationFrame(() => document.getElementById(`field-${first}`)?.focus());
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result =
        editing.mode === "create" ? await actions.create(payload) : await actions.update({ id: editing.id, values: payload });
      if (result.ok) {
        const suffixed = editing.mode === "create" && "slug" in result && result.slug !== values.slug;
        toast.success(
          editing.mode === "create"
            ? suffixed
              ? `Category created at /${result.slug} (that address was taken)`
              : "Category created"
            : "Category saved",
        );
        setEditing(null);
        router.refresh();
      } else {
        setErrors(fail(result, "save the category"));
      }
    });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const result = await actions.remove({ id: toDelete.id });
    setDeleting(false);
    setToDelete(null);
    if (result.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      fail(result, "delete it");
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal"
        >
          <Plus weight="bold" size={16} aria-hidden="true" />
          New category
        </button>
      </div>

      {categories.length > 0 ? (
        <ul className="mt-4 divide-y divide-midnight/10 rounded-2xl bg-white ring-1 ring-midnight/10">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-midnight">{c.name}</p>
                <p className="break-all text-sm text-midnight/70">
                  /{c.slug} · {countText(c.count, noun)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderInput key={`${c.id}-${c.order}`} category={c} setOrder={actions.setOrder} />
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="min-h-11 rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4 hover:bg-midnight/5"
                >
                  Edit<span className="sr-only"> {c.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(c)}
                  className="min-h-11 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10"
                >
                  Delete<span className="sr-only"> {c.name}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} label={editing?.mode === "edit" ? "Edit category" : "New category"}>
        <form onSubmit={submit} noValidate className="space-y-5 p-5 sm:p-6">
          <h2 className="font-heading text-xl font-bold text-midnight">
            {editing?.mode === "edit" ? "Edit category" : "New category"}
          </h2>
          <Field
            label="Name"
            name="name"
            required
            value={values.name}
            error={errors.name}
            onChange={(ev) => {
              set("name", ev.target.value);
              if (!slugTouched) set("slug", slugify(ev.target.value));
            }}
          />
          <Field
            label="Web address (slug)"
            name="slug"
            required
            value={values.slug}
            error={errors.slug}
            help={`Used in ${basePath}?category=${values.slug || "…"}. Changing it later breaks old filter links.`}
            onChange={(ev) => {
              setSlugTouched(true);
              set("slug", ev.target.value);
            }}
          />
          {withDescription ? (
            <TextareaField
              label="Description (optional)"
              name="description"
              rows={3}
              limit={LIMITS.categoryDescription}
              value={values.description}
              error={errors.description}
              onChange={(ev) => set("description", ev.target.value)}
            />
          ) : null}
          <Field
            label="Display order"
            name="order"
            type="number"
            inputMode="numeric"
            value={values.order}
            error={errors.order}
            help="Lower numbers come first."
            onChange={(ev) => set("order", ev.target.value)}
          />
          <div className="flex flex-wrap gap-3 border-t border-midnight/10 pt-5">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70"
            >
              {saving ? "Saving…" : editing?.mode === "edit" ? "Save changes" : "Create category"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this category?"
        body={
          toDelete && toDelete.count > 0
            ? `“${toDelete.name}” still has ${countText(toDelete.count, noun)}, so it can't be deleted yet. Move them to another category or delete them first.`
            : `“${toDelete?.name ?? "This category"}” will be removed for good. This can't be undone.`
        }
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
