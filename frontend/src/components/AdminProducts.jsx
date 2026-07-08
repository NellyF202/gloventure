import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Package } from "lucide-react";
import { toast } from "sonner";
import api, { formatMWK } from "../lib/api";

const EMPTY_FORM = { name: "", size_kg: "", price_mwk: "", description: "", badge: "" };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, size_kg: p.size_kg, price_mwk: p.price_mwk, description: p.description || "", badge: p.badge || "" });
    setShowForm(true);
  };

  const cancel = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.size_kg || !form.price_mwk) {
      toast.error("Name, size (kg) and price are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      size_kg: parseInt(form.size_kg),
      price_mwk: parseInt(form.price_mwk),
      description: form.description.trim(),
      badge: form.badge.trim() || null,
    };
    try {
      if (editId) {
        const { data } = await api.put(`/admin/products/${editId}`, payload);
        setProducts((prev) => prev.map((p) => (p.id === editId ? data : p)));
        toast.success("Product updated");
      } else {
        const { data } = await api.post("/admin/products", payload);
        setProducts((prev) => [...prev, data]);
        toast.success("Product created");
      }
      cancel();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>
          {products.length} product{products.length !== 1 ? "s" : ""} in catalogue
        </p>
        <button onClick={openAdd} className="btn-primary" data-testid="add-product-btn">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card-solution mb-6" data-testid="product-form">
          <h3 className="font-display text-xl mb-4" style={{ color: "var(--glo-text)" }}>
            {editId ? "Edit Product" : "New Product"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Product Name *</label>
              <input
                className="glo-input mt-1"
                placeholder="GLO Premium Rice — Family Pack"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-testid="product-form-name"
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Size (kg) *</label>
              <input
                className="glo-input mt-1"
                type="number"
                min="1"
                placeholder="5"
                value={form.size_kg}
                onChange={(e) => setForm({ ...form, size_kg: e.target.value })}
                required
                data-testid="product-form-size"
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Price (MWK) *</label>
              <input
                className="glo-input mt-1"
                type="number"
                min="1"
                placeholder="8500"
                value={form.price_mwk}
                onChange={(e) => setForm({ ...form, price_mwk: e.target.value })}
                required
                data-testid="product-form-price"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Description</label>
              <textarea
                className="glo-input mt-1"
                rows={2}
                placeholder="Short product description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="product-form-description"
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: "var(--glo-text-2)" }}>Badge (optional)</label>
              <input
                className="glo-input mt-1"
                placeholder="Most popular"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                data-testid="product-form-badge"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <button type="submit" disabled={saving} className="btn-primary" data-testid="product-form-save">
              <Check size={16} /> {saving ? "Saving…" : editId ? "Update Product" : "Create Product"}
            </button>
            <button type="button" onClick={cancel} className="btn-secondary" data-testid="product-form-cancel">
              <X size={16} /> Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: "var(--glo-text-3)" }}>Loading products…</p>}

      <div className="grid gap-4">
        {products.map((p) => (
          <div key={p.id} className="card-solution flex flex-wrap justify-between items-start gap-4" data-testid={`product-row-${p.id}`}>
            <div className="flex gap-4 items-start">
              <div className="icon-tile icon-tile-ochre"><Package size={20} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg" style={{ color: "var(--glo-text)" }}>{p.name}</p>
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--glo-ochre)", color: "#fff" }}>
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: "var(--glo-text-2)" }}>{p.size_kg} kg · {p.description}</p>
                <p className="font-display text-xl mt-1" style={{ color: "var(--glo-green)" }}>{formatMWK(p.price_mwk)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(p)}
                className="btn-secondary"
                data-testid={`product-edit-${p.id}`}
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                onClick={() => remove(p.id, p.name)}
                className="btn-secondary"
                style={{ color: "var(--glo-coral, #c0392b)", borderColor: "var(--glo-coral, #c0392b)" }}
                data-testid={`product-delete-${p.id}`}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="card-solution text-center">
          <p style={{ color: "var(--glo-text-3)" }}>No products yet. Add your first product above.</p>
        </div>
      )}
    </div>
  );
}
