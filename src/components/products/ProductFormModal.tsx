'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product, ProductCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { generateSlug } from '@/lib/utils';
import { Plus, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

const defaultImages = [
  '/product_dress_1_1790064527682.jpg',
  '/product_blazer_1_1790064551000.jpg',
  '/product_bag_1_1790064566991.jpg',
  '/product_shoes_1_1790064655581.jpg',
  '/product_coat_1_1790064693853.jpg',
  '/product_scarf_1_1790064780482.jpg',
];

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ProductCategory>('dress');
  const [price, setPrice] = useState<number>(1000000);
  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [sizesInput, setSizesInput] = useState('S, M, L');
  const [colorsInput, setColorsInput] = useState('Black, Gold');
  const [tagsInput, setTagsInput] = useState('luxury, exclusive');
  const [imageUrl, setImageUrl] = useState('/product_dress_1_1790064527682.jpg');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSlug(product.slug);
      setCategory(product.category);
      setPrice(product.price);
      setComparePrice(product.comparePrice);
      setStock(product.stock);
      setDescription(product.description || '');
      setSizesInput(product.sizes?.join(', ') || '');
      setColorsInput(product.colors?.join(', ') || '');
      setTagsInput(product.tags?.join(', ') || '');
      setImageUrl(product.images?.[0] || defaultImages[0]);
      setFeatured(product.featured || false);
    } else {
      setName('');
      setSlug('');
      setCategory('dress');
      setPrice(2500000);
      setComparePrice(undefined);
      setStock(15);
      setDescription('');
      setSizesInput('S, M, L');
      setColorsInput('Black, Gold');
      setTagsInput('luxury, new');
      setImageUrl(defaultImages[0]);
      setFeatured(false);
    }
  }, [product, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const sizes = sizesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const colors = colorsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload: Partial<Product> = {
        name,
        slug: slug || generateSlug(name),
        category,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        stock: Number(stock),
        description,
        sizes,
        colors,
        tags,
        images: [imageUrl],
        featured,
        rating: product?.rating ?? 5.0,
        reviewCount: product?.reviewCount ?? 0,
      };

      await onSave(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Informasi Produk' : 'Tambah Produk Baru'}
      subtitle={isEditing ? `SKU: ${product?.id}` : 'Isi formulir lengkap untuk menambahkan produk ke katalog'}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            disabled={submitting}
          >
            Batal
          </button>
          <button
            type="submit"
            form="product-form"
            className="btn btn-primary btn-sm shadow-gold"
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Produk Baru'}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Nama Produk *</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="Contoh: Velvet Noir Midi Gown"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="input-label">Slug URL</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="velvet-noir-midi-gown"
              className="input text-sm font-mono"
            />
          </div>
        </div>

        {/* Row 2: Category, Price, Compare Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Kategori *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="input select text-sm"
            >
              <option value="dress">Dress & Gown</option>
              <option value="blazer">Tailored Blazer</option>
              <option value="bag">Leather Bag</option>
              <option value="shoes">Shoes & Heels</option>
              <option value="coat">Overcoat</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label className="input-label">Harga Jual (IDR) *</label>
            <input
              type="number"
              required
              min={1000}
              step={10000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="input text-sm font-semibold"
            />
          </div>
          <div>
            <label className="input-label">Harga Coret (Opsional)</label>
            <input
              type="number"
              min={1000}
              step={10000}
              value={comparePrice || ''}
              onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Contoh: 3500000"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Row 3: Stock & Featured Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="input-label">Jumlah Stok Awal *</label>
            <input
              type="number"
              required
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="input text-sm"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded bg-[#181818] border-[#333] accent-[#c9a84c] cursor-pointer"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-200 cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold" />
              Tampilkan di Beranda (Featured)
            </label>
          </div>
        </div>

        {/* Row 4: Sizes & Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Ukuran (Pisahkan dengan koma)</label>
            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="XS, S, M, L, XL"
              className="input text-sm"
            />
          </div>
          <div>
            <label className="input-label">Varian Warna (Pisahkan koma)</label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Black, Gold, Cream"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Row 5: Tags */}
        <div>
          <label className="input-label">Tags (Pisahkan dengan koma)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="evening, silk, couture, runway"
            className="input text-sm"
          />
        </div>

        {/* Row 6: Description */}
        <div>
          <label className="input-label">Deskripsi Lengkap</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi keunggulan bahan, potongan jahitan, dan karakteristik busana mewah..."
            className="input textarea text-sm resize-none"
          />
        </div>

        {/* Row 7: Image Selection & Preview */}
        <div>
          <label className="input-label">Gambar Produk</label>
          <div className="space-y-3">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/product_dress_1_1790064527682.jpg"
              className="input text-sm font-mono"
            />

            {/* Quick preset selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">Pilih Cepat:</span>
              {defaultImages.map((img) => (
                <button
                  type="button"
                  key={img}
                  onClick={() => setImageUrl(img)}
                  className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all shrink-0 ${
                    imageUrl === img ? 'border-gold scale-105' : 'border-[#333] opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt="thumbnail" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
