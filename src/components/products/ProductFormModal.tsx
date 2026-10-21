'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Product, ProductCategory, ColorVariant, Category, NavigationItem } from '@/types';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { generateSlug } from '@/lib/utils';
import {
  Plus,
  X,
  Sparkles,
  Trash2,
  Check,
  AlertCircle,
  Palette,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories?: Category[];
  initialCategory?: string;
}

const defaultImages = [
  '/gown_black.jpg',
  '/gown_navy.jpg',
  '/gown_white.jpg',
  '/gown_ecru.jpg',
  '/dress_black.jpg',
  '/dress_burgundy.jpg',
  '/dress_emerald.jpg',
  '/dress_sapphire.jpg',
  '/blazer_black.jpg',
  '/blazer_ecru.png',
  '/blazer_navy.png',
  '/blazer_stone.png',
  '/bag_black.jpg',
  '/bag_burgundy.jpg',
  '/bag_cognac.jpg',
  '/bag_ivory.jpg',
  '/bag_navy.jpg',
  '/bag_taupe.png',
  '/shoes_black.jpg',
  '/shoes_ivory.jpg',
  '/shoes_navy.jpg',
  '/shoes_white.jpg',
  '/coat_black.jpg',
  '/coat_camel.jpg',
  '/coat_ecru.jpg',
  '/trousers_black.jpg',
  '/trousers_ecru.jpg',
  '/trousers_navy.jpg',
  '/trousers_stone.jpg',
  '/scarf_black.jpg',
  '/scarf_ivory.jpg',
  '/scarf_navy.jpg',
  '/belt_black.jpg',
  '/belt_tan.png',
  '/belt_white.png',
  '/charm_black.jpg',
  '/charm_burgundy.jpg',
  '/charm_cognac.jpg',
  '/charm_ivory.jpg',
  '/charm_navy.jpg',
];

function formatThousand(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatHex(hex: string): string {
  let val = (hex || '').trim();
  if (!val.startsWith('#')) val = `#${val}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
  if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
    return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
  }
  return '#000000';
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  initialCategory,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [categoriesList, setCategoriesList] = useState<Category[]>(categories || []);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
      return;
    }
    api.categories.list({ all: true }).then((res) => {
      if (res.success && res.data) {
        setCategoriesList(res.data);
      }
    });
  }, [categories, isOpen]);

  // Navigation Menus State (Requirement 4)
  const [navMenus, setNavMenus] = useState<NavigationItem[]>([]);
  const [menuIds, setMenuIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.navigation.list().then((res) => {
        if (res.success && res.data) {
          setNavMenus(res.data);
        }
      });
    }
  }, [isOpen]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ProductCategory>('dress');
  const [gender, setGender] = useState<'women' | 'men' | 'unisex'>('women');
  const [collection, setCollection] = useState<boolean>(false);

  // Price & Compare Price (Part A)
  const [price, setPrice] = useState<number>(2500000);
  const [priceDisplay, setPriceDisplay] = useState('2.500.000');
  const [priceError, setPriceError] = useState('');

  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [comparePriceDisplay, setComparePriceDisplay] = useState('');
  const [comparePriceError, setComparePriceError] = useState('');

  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [descError, setDescError] = useState('');

  // Sizes management (Part B)
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [sizesInput, setSizesInput] = useState('S, M, L');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [pendingDeleteSize, setPendingDeleteSize] = useState<{
    size: string;
    stock: number;
  } | null>(null);

  const [tagsInput, setTagsInput] = useState('luxury, exclusive');
  const [imageUrl, setImageUrl] = useState('/product_dress_1_1790064527682.jpg');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Color Variants State
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
    {
      name: 'Black',
      hex: '#000000',
      images: [defaultImages[0]],
      sizeStock: { S: 5, M: 5, L: 5 },
      stock: 15,
    },
  ]);
  const [variantError, setVariantError] = useState('');
  const [imageError, setImageError] = useState('');
  const [stockErrors, setStockErrors] = useState<Record<number, string>>({});

  // Quick fill state for "Isi semua ukuran dengan..."
  const [fillingIndex, setFillingIndex] = useState<number | null>(null);
  const [fillValue, setFillValue] = useState('');

  // Total stock is automatically calculated from the sum of all color variants' size stocks (Requirement 7)
  const totalStock = useMemo(() => {
    return colorVariants.reduce((sum, v) => {
      const cvTotal = sizes.reduce(
        (sSum, sz) => sSum + (Number(v.sizeStock?.[sz]) || 0),
        0
      );
      return sum + cvTotal;
    }, 0);
  }, [colorVariants, sizes]);

  // Collect available images for thumbnail picking
  const availableImages = Array.from(
    new Set([
      ...defaultImages,
      ...(product?.images || []),
      ...(imageUrl ? [imageUrl] : []),
      ...(colorVariants.flatMap((cv) => cv.images) || []),
      ...(product?.colorVariants?.flatMap((cv) => cv.images) || []),
    ])
  ).filter(Boolean);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSlug(product.slug);
      setCategory(product.category);
      setGender(product.gender || 'women');
      setCollection(Boolean(product.collection));

      // Fetch menus where this product is already assigned (Requirement 4)
      if (product.id) {
        api.products
          .getMenus(product.id)
          .then((res) => {
            if (res.success && Array.isArray(res.data?.menuIds)) {
              setMenuIds(res.data.menuIds);
            } else if (product.menuIds) {
              setMenuIds(product.menuIds);
            } else {
              setMenuIds([]);
            }
          })
          .catch(() => {
            setMenuIds(product.menuIds || []);
          });
      } else {
        setMenuIds(product.menuIds || []);
      }

      // Price initial values populated as-is from product data (Requirement 4)
      setPrice(product.price);
      setPriceDisplay(formatThousand(product.price));
      setPriceError('');

      setComparePrice(product.comparePrice);
      setComparePriceDisplay(
        product.comparePrice ? formatThousand(product.comparePrice) : ''
      );
      setComparePriceError('');

      setDescription(product.description || '');
      setShortDescription(product.shortDescription || '');

      // Initialize sizes
      const allVariantSizes = product.colorVariants
        ? Array.from(
            new Set(
              product.colorVariants.flatMap((cv) =>
                cv.sizeStock ? Object.keys(cv.sizeStock) : []
              )
            )
          )
        : [];
      const initSizes =
        product.sizes && product.sizes.length > 0
          ? Array.from(
              new Set([
                ...product.sizes.map((s) => s.trim()).filter(Boolean),
                ...allVariantSizes,
              ])
            )
          : allVariantSizes.length > 0
          ? allVariantSizes
          : ['S', 'M', 'L'];
      setSizes(initSizes);
      setSizesInput(initSizes.join(', '));
      setNewSizeInput('');

      setTagsInput(product.tags?.join(', ') || '');
      setImageUrl(product.images?.[0] || defaultImages[0]);
      setFeatured(product.featured || false);

      // Populate existing colorVariants and normalize sizeStock
      if (product.colorVariants && product.colorVariants.length > 0) {
        setColorVariants(
          product.colorVariants.map((cv) => {
            const sizeStock: Record<string, number> = {};
            if (cv.sizeStock && Object.keys(cv.sizeStock).length > 0) {
              initSizes.forEach((sz) => {
                sizeStock[sz] =
                  typeof cv.sizeStock?.[sz] === 'number'
                    ? cv.sizeStock[sz]
                    : cv.sizeStock?.[sz] !== undefined &&
                      cv.sizeStock?.[sz] !== null &&
                      !isNaN(Number(cv.sizeStock[sz]))
                    ? Number(cv.sizeStock[sz])
                    : 0;
              });
            } else {
              // Distribute existing stock across sizes
              const total =
                typeof cv.stock === 'number' ? cv.stock : product.stock || 0;
              const perSize = Math.floor(total / initSizes.length);
              const remainder = total - perSize * initSizes.length;
              initSizes.forEach((sz, idx) => {
                sizeStock[sz] = idx === 0 ? perSize + remainder : perSize;
              });
            }
            const cvTotal = Object.values(sizeStock).reduce(
              (sum, n) => sum + (Number(n) || 0),
              0
            );
            return {
              name: cv.name,
              hex: cv.hex || '#000000',
              images:
                Array.isArray(cv.images) && cv.images.length > 0
                  ? cv.images
                  : [defaultImages[0]],
              sizeStock,
              stock: cvTotal,
              ...(cv.price !== undefined ? { price: cv.price } : {}),
            };
          })
        );
      } else if (product.colors && product.colors.length > 0) {
        const perColorTotal = Math.floor(
          (product.stock || 0) / product.colors.length
        );
        setColorVariants(
          product.colors.map((cName, idx) => {
            const sizeStock: Record<string, number> = {};
            const total =
              idx === 0
                ? (product.stock || 0) -
                  perColorTotal * (product.colors.length - 1)
                : perColorTotal;
            const perSize = Math.floor(total / initSizes.length);
            const remainder = total - perSize * initSizes.length;
            initSizes.forEach((sz, sIdx) => {
              sizeStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
            });
            return {
              name: cName,
              hex: idx === 0 ? '#000000' : '#c9a84c',
              images:
                product.images && product.images.length > 0
                  ? [product.images[0]]
                  : [defaultImages[0]],
              sizeStock,
              stock: total,
            };
          })
        );
      } else {
        const initSizeStock: Record<string, number> = {};
        const total = product.stock ?? 10;
        const perSize = Math.floor(total / initSizes.length);
        const remainder = total - perSize * initSizes.length;
        initSizes.forEach((sz, sIdx) => {
          initSizeStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
        });
        setColorVariants([
          {
            name: 'Black',
            hex: '#000000',
            images: [defaultImages[0]],
            sizeStock: initSizeStock,
            stock: total,
          },
        ]);
      }
    } else {
      setName('');
      setSlug('');
      setCategory(initialCategory || categoriesList[0]?.slug || 'dress');
      setGender('women');
      setCollection(false);
      setMenuIds([]);
      setPrice(2500000);
      setPriceDisplay('2.500.000');
      setPriceError('');
      setComparePrice(undefined);
      setComparePriceDisplay('');
      setComparePriceError('');
      setDescription('');
      setShortDescription('');

      const initSizes = ['S', 'M', 'L'];
      setSizes(initSizes);
      setSizesInput('S, M, L');
      setNewSizeInput('');
      setTagsInput('luxury, new');
      setImageUrl(defaultImages[0]);
      setFeatured(false);

      const initSizeStock: Record<string, number> = { S: 5, M: 5, L: 5 };
      setColorVariants([
        {
          name: 'Black',
          hex: '#000000',
          images: [defaultImages[0]],
          sizeStock: initSizeStock,
          stock: 15,
        },
      ]);
    }

    setDescError('');
    setVariantError('');
    setImageError('');
    setStockErrors({});
    setPendingDeleteSize(null);
    setFillingIndex(null);
    setFillValue('');
  }, [product, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  // Price handlers with thousand separators & validation (Requirement 1 & 2)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setPriceDisplay('');
      setPrice(0);
      setPriceError('Harga jual wajib diisi dan harus berupa angka bulat lebih dari 0.');
      return;
    }
    const num = parseInt(digits, 10);
    setPrice(num);
    setPriceDisplay(formatThousand(digits));

    if (num <= 0) {
      setPriceError('Harga jual wajib diisi dan harus berupa angka bulat lebih dari 0.');
    } else {
      setPriceError('');
      if (comparePrice && comparePrice <= num) {
        setComparePriceError('Harga coret (jika diisi) harus lebih besar dari harga jual.');
      } else if (comparePrice && comparePrice > num) {
        setComparePriceError('');
      }
    }
  };

  const handleComparePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setComparePriceDisplay('');
      setComparePrice(undefined);
      setComparePriceError('');
      return;
    }
    const num = parseInt(digits, 10);
    setComparePrice(num);
    setComparePriceDisplay(formatThousand(digits));

    if (num <= price) {
      setComparePriceError('Harga coret (jika diisi) harus lebih besar dari harga jual.');
    } else {
      setComparePriceError('');
    }
  };

  // Sizes Management (Requirement 6)
  const handleAddSize = (rawSizeName: string) => {
    const trimmed = rawSizeName.trim().toUpperCase();
    if (!trimmed || sizes.includes(trimmed)) {
      setNewSizeInput('');
      return;
    }
    const nextSizes = [...sizes, trimmed];
    setSizes(nextSizes);
    setSizesInput(nextSizes.join(', '));
    setNewSizeInput('');

    // Kolom baru muncul dengan nilai 0 di semua warna (Requirement 6)
    setColorVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sizeStock: {
          ...(v.sizeStock || {}),
          [trimmed]: 0,
        },
      }))
    );
  };

  const handleRequestRemoveSize = (sizeToRemove: string) => {
    const stockInSize = colorVariants.reduce(
      (sum, v) => sum + (Number(v.sizeStock?.[sizeToRemove]) || 0),
      0
    );

    // Jika ukuran yang dihapus masih punya stok > 0, tampilkan konfirmasi (Requirement 6)
    if (stockInSize > 0) {
      setPendingDeleteSize({ size: sizeToRemove, stock: stockInSize });
    } else {
      confirmRemoveSize(sizeToRemove);
    }
  };

  const confirmRemoveSize = (sizeToRemove: string) => {
    const nextSizes = sizes.filter((s) => s !== sizeToRemove);
    setSizes(nextSizes);
    setSizesInput(nextSizes.join(', '));

    setColorVariants((prev) =>
      prev.map((v) => {
        const nextSizeStock = { ...(v.sizeStock || {}) };
        delete nextSizeStock[sizeToRemove];
        const newStock = nextSizes.reduce(
          (sum, s) => sum + (Number(nextSizeStock[s]) || 0),
          0
        );
        return {
          ...v,
          sizeStock: nextSizeStock,
          stock: newStock,
        };
      })
    );
    setPendingDeleteSize(null);
  };

  const handleSizesBlur = () => {
    const parsed = sizesInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (parsed.length === 0) {
      setSizesInput(sizes.join(', '));
      return;
    }

    // Detect removed sizes
    const removed = sizes.filter((s) => !parsed.includes(s));
    // Check if any removed size has active stock > 0
    const critical = removed.find((s) =>
      colorVariants.some((v) => (Number(v.sizeStock?.[s]) || 0) > 0)
    );

    if (critical) {
      const totalStock = colorVariants.reduce(
        (sum, v) => sum + (Number(v.sizeStock?.[critical]) || 0),
        0
      );
      setPendingDeleteSize({ size: critical, stock: totalStock });
      return;
    }

    // Apply additions and removals
    const newSizes = Array.from(new Set(parsed));
    setSizes(newSizes);

    setColorVariants((prev) =>
      prev.map((v) => {
        const nextSizeStock: Record<string, number> = {};
        newSizes.forEach((sz) => {
          nextSizeStock[sz] =
            typeof v.sizeStock?.[sz] === 'number' ? v.sizeStock[sz] : 0;
        });
        const newStock = newSizes.reduce(
          (sum, s) => sum + (Number(nextSizeStock[s]) || 0),
          0
        );
        return {
          ...v,
          sizeStock: nextSizeStock,
          stock: newStock,
        };
      })
    );
  };

  // Color Variants Management
  const handleAddVariant = () => {
    const initSizeStock: Record<string, number> = {};
    sizes.forEach((sz) => {
      initSizeStock[sz] = 0;
    });

    setColorVariants((prev) => [
      ...prev,
      {
        name: '',
        hex: '#c9a84c',
        images: [defaultImages[0]],
        sizeStock: initSizeStock,
        stock: 0,
      },
    ]);
    if (variantError) setVariantError('');
  };

  const handleRemoveVariant = (index: number) => {
    if (colorVariants.length <= 1) return;
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
    if (variantError) setVariantError('');
    setStockErrors((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleUpdateVariant = <K extends keyof ColorVariant>(
    index: number,
    field: K,
    value: ColorVariant[K]
  ) => {
    setColorVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    if (variantError) setVariantError('');
  };

  // Size Stock within Color Variant (Requirement 5)
  const handleUpdateSizeStock = (
    variantIndex: number,
    size: string,
    value: string
  ) => {
    let rawVal: number | string = value;
    if (value !== '' && !isNaN(Number(value))) {
      rawVal = Number(value);
    }

    setColorVariants((prev) => {
      const copy = [...prev];
      const target = { ...copy[variantIndex] };
      const nextSizeStock = { ...(target.sizeStock || {}), [size]: rawVal as number };
      const newStock = sizes.reduce(
        (sum, sz) => sum + (Number(nextSizeStock[sz]) || 0),
        0
      );
      target.sizeStock = nextSizeStock;
      target.stock = newStock;
      copy[variantIndex] = target;
      return copy;
    });

    if (variantError) setVariantError('');
    if (stockErrors[variantIndex]) {
      setStockErrors((prev) => {
        const copy = { ...prev };
        delete copy[variantIndex];
        return copy;
      });
    }
  };

  // Quick fill all sizes for a color variant (Requirement 5)
  const handleFillAllSizes = (variantIndex: number, fillVal: number) => {
    const safeVal = Math.max(0, Math.floor(fillVal));
    setColorVariants((prev) => {
      const copy = [...prev];
      const target = { ...copy[variantIndex] };
      const nextSizeStock: Record<string, number> = {};
      sizes.forEach((sz) => {
        nextSizeStock[sz] = safeVal;
      });
      target.sizeStock = nextSizeStock;
      target.stock = safeVal * sizes.length;
      copy[variantIndex] = target;
      return copy;
    });

    if (stockErrors[variantIndex]) {
      setStockErrors((prev) => {
        const copy = { ...prev };
        delete copy[variantIndex];
        return copy;
      });
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    // Validate Price (Requirement 2)
    if (!price || price <= 0) {
      setPriceError('Harga jual wajib diisi dan harus berupa angka bulat lebih dari 0.');
      hasError = true;
    }

    // Validate ComparePrice (Requirement 2)
    if (comparePrice !== undefined && comparePrice > 0 && comparePrice <= price) {
      setComparePriceError('Harga coret (jika diisi) harus lebih besar dari harga jual.');
      hasError = true;
    }

    if (!description.trim()) {
      setDescError('Deskripsi produk wajib diisi.');
      hasError = true;
    }

    if (!imageUrl || !imageUrl.trim()) {
      setImageError('Gambar utama produk wajib dipilih atau diunggah.');
      hasError = true;
    }

    if (sizes.length === 0) {
      setVariantError('Minimal harus ada 1 ukuran produk.');
      hasError = true;
    }

    // Color Variants basic validation
    if (colorVariants.length === 0) {
      setVariantError('Minimal harus ada 1 varian warna.');
      hasError = true;
    } else if (colorVariants.some((v) => !v.name.trim())) {
      setVariantError('Semua nama varian warna wajib diisi.');
      hasError = true;
    } else {
      const names = colorVariants.map((v) => v.name.trim().toLowerCase());
      const hasDuplicates = new Set(names).size !== names.length;
      if (hasDuplicates) {
        setVariantError('Nama varian warna tidak boleh kembar (duplikat).');
        hasError = true;
      } else if (colorVariants.some((v) => !v.images || v.images.length === 0)) {
        setVariantError('Setiap varian warna harus memiliki minimal 1 foto yang dipilih.');
        hasError = true;
      }
    }

    if (hasError) return;

    setSubmitting(true);

    try {
      // Buang field turunan stock di level warna; hanya kirim sizeStock dan field editan admin
      const cleanedVariants = colorVariants.map((v) => {
        const cleanedSizeStock: Record<string, number> = {};
        sizes.forEach((sz) => {
          const raw = v.sizeStock?.[sz];
          cleanedSizeStock[sz] =
            (raw as unknown) === '' || raw === null || raw === undefined
              ? ('' as unknown as number)
              : typeof raw === 'number'
              ? raw
              : isNaN(Number(raw))
              ? (raw as unknown as number)
              : Number(raw);
        });
        return {
          name: v.name.trim(),
          hex: formatHex(v.hex),
          images: v.images,
          sizeStock: cleanedSizeStock,
          ...(v.price !== undefined ? { price: v.price } : {}),
        };
      });

      const colors = cleanedVariants.map((v) => v.name);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // Buang field turunan stock di level produk
      const payload: Partial<Product> = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        category,
        gender,
        collection,
        menuIds,
        price: Math.floor(Number(price)),
        comparePrice: comparePrice ? Math.floor(Number(comparePrice)) : undefined,
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        sizes,
        colors,
        colorVariants: cleanedVariants,
        tags,
        images: [imageUrl],
        featured,
      };

      await onSave(payload);

      // If editing an existing product, also update its menu assignments (Requirement 4)
      if (isEditing && product?.id) {
        try {
          await api.products.updateMenus(product.id, menuIds);
        } catch {
          // Gracefully continue
        }
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVariantError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Ubah Informasi Produk' : 'Tambah Produk Baru'}
        subtitle={isEditing ? `SKU: ${product?.id}` : 'Isi formulir lengkap untuk menambahkan produk ke katalog'}
        maxWidth="4xl"
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
        <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
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

          {/* Row 2: Category & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Kategori *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="input select text-sm"
              >
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label_en || c.name}{c.label_id ? ` (${c.label_id})` : ''}{!c.active ? ' (disembunyikan)' : ''}
                  </option>
                ))}
                {category && !categoriesList.some((c) => c.slug === category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>

            <div>
              <label className="input-label flex items-center justify-between">
                <span>Gender *</span>
                <span className="text-[11px] text-gold font-normal">Wajib diisi</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'women' | 'men' | 'unisex')}
                className="input select text-sm font-medium"
                required
              >
                <option value="women">Women (Wanita)</option>
                <option value="men">Men (Pria)</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* Row 3: Price, Compare Price, Total Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Harga Jual (Requirement 1 & 2) */}
            <div>
              <label className="input-label">Harga Jual (IDR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold font-mono pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  placeholder="2.200.000"
                  className={`input pl-10 text-sm font-semibold font-mono ${
                    priceError ? 'border-rose-500 focus:border-rose-500' : ''
                  }`}
                />
              </div>
              {priceError ? (
                <p className="text-xs text-rose-400 mt-1 font-medium animate-fadeIn">
                  {priceError}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">
                  Format angka dengan pemisah ribuan otomatis
                </p>
              )}
            </div>

            {/* Harga Coret (Requirement 1 & 2) */}
            <div>
              <label className="input-label">Harga Coret (Opsional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 font-mono pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={comparePriceDisplay}
                  onChange={handleComparePriceChange}
                  placeholder="Contoh: 3.500.000"
                  className={`input pl-10 text-sm font-mono ${
                    comparePriceError ? 'border-rose-500 focus:border-rose-500' : ''
                  }`}
                />
              </div>
              {comparePriceError ? (
                <p className="text-xs text-rose-400 mt-1 font-medium animate-fadeIn">
                  {comparePriceError}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">
                  Wajib lebih besar dari harga jual jika diisi
                </p>
              )}
            </div>

            {/* Total Stok (Read-only) */}
            <div>
              <label className="input-label">Total Stok (Dihitung)</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={`${totalStock} pcs`}
                  className="input text-sm font-semibold bg-[#111111] text-gold cursor-not-allowed border-[#333333] font-mono"
                  tabIndex={-1}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Dihitung otomatis dari seluruh kombinasi warna dan ukuran produk
              </p>
            </div>
          </div>

          {/* Row 3b: Status Checkboxes (Featured & Collection) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
              Kurasi & Penempatan Etalase Toko
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Featured Checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181818] border border-[#2a2a2a]">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-[#181818] border-[#333] accent-[#c9a84c] cursor-pointer"
                />
                <label
                  htmlFor="featured"
                  className="text-xs text-gray-200 cursor-pointer select-none space-y-0.5"
                >
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    Tampilkan di Beranda (Featured)
                  </span>
                  <span className="text-gray-400 block text-[11px]">
                    Produk akan disorot pada section unggulan halaman utama.
                  </span>
                </label>
              </div>

              {/* Collection Checkbox */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181818] border border-[#2a2a2a]">
                <input
                  type="checkbox"
                  id="collection"
                  checked={collection}
                  onChange={(e) => setCollection(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-[#181818] border-[#333] accent-[#c9a84c] cursor-pointer"
                />
                <label
                  htmlFor="collection"
                  className="text-xs text-gray-200 cursor-pointer select-none space-y-0.5"
                >
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Masuk Kurasi Koleksi (Collection)
                  </span>
                  <span className="text-gray-400 block text-[11px]">
                    Ditampilkan di etalase /collections. BE otomatis mengikutsertakan jika berstatus Featured atau memiliki tag koleksi khusus (luxury, bestseller, evening, dll).
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 3c: Tampilkan di Menu Navbar (Requirement 4) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#242424] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                  Tampilkan di Menu Navbar
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Pilih menu navbar di mana produk ini akan ditampilkan di storefront.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#333] text-gray-300">
                {menuIds.length} menu dipilih
              </span>
            </div>

            {navMenus.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                Belum ada menu navbar yang dibuat. Kelola menu di halaman Menu Navbar.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {navMenus.map((menu) => {
                  const isChecked = menuIds.includes(menu.id);
                  return (
                    <label
                      key={menu.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#c9a84c]/10 border-[#c9a84c]/40 text-white shadow-sm'
                          : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#383838] hover:bg-[#1f1f1f]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMenuIds((prev) => [...prev, menu.id]);
                          } else {
                            setMenuIds((prev) => prev.filter((id) => id !== menu.id));
                          }
                        }}
                        className="w-4 h-4 mt-0.5 rounded bg-[#181818] border-[#333] accent-[#c9a84c] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-white truncate">
                            {menu.label_en || menu.label}
                          </span>
                          {menu.accent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30">
                              Sorot
                            </span>
                          )}
                          {!menu.active && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#222] text-gray-500">
                              Sembunyi
                            </span>
                          )}
                        </div>
                        {menu.label_id && menu.label_id !== (menu.label_en || menu.label) && (
                          <span className="text-[11px] text-gray-400 block truncate">
                            {menu.label_id}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 4: Sizes & Tags (Requirement 6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="input-label mb-1">
                Ukuran Produk * (Kelola daftar ukuran)
              </label>

              {/* Active size pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#0e0e0e] border border-[#222]">
                {sizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1c1c1c] border border-[#333] text-xs font-mono font-medium text-gray-200"
                  >
                    <span>{sz}</span>
                    <button
                      type="button"
                      onClick={() => handleRequestRemoveSize(sz)}
                      className="p-0.5 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={`Hapus ukuran ${sz}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Quick Add Size input */}
                <div className="flex items-center gap-1 pl-1">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSize(newSizeInput);
                      }
                    }}
                    placeholder="+ Ukuran..."
                    className="w-20 text-xs px-2 py-1 bg-transparent border border-dashed border-[#444] rounded text-white focus:border-gold outline-none uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSize(newSizeInput)}
                    className="p-1 rounded text-gold hover:bg-gold/10"
                    title="Tambah ukuran"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Direct comma-separated input for power users */}
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                onBlur={handleSizesBlur}
                placeholder="XS, S, M, L, XL"
                className="input text-xs font-mono"
                title="Dapat juga diedit langsung dengan pemisah koma"
              />
              <p className="text-[11px] text-gray-500">
                Kolom ukuran baru otomatis bernilai 0 di semua warna. Hapus badge untuk menghapus ukuran.
              </p>
            </div>

            <div>
              <label className="input-label">Tags (Pisahkan dengan koma)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="evening, silk, couture, runway"
                className="input text-sm"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Kata kunci untuk pencarian dan filter etalase
              </p>
            </div>
          </div>

          {/* Row 5: Color Variants Editor (Requirement 5) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gold" />
                  <label className="input-label mb-0 text-white">
                    Varian Warna & Stok per Ukuran *
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Atur foto, warna, dan stok masing-masing ukuran untuk setiap varian busana
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 hover:border-gold/50 text-gold self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Warna
              </button>
            </div>

            {/* Validation error message */}
            {variantError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{variantError}</span>
              </div>
            )}

            {/* Variants List */}
            <div className="space-y-4 pt-1">
              {colorVariants.map((variant, index) => {
                const isOnlyOne = colorVariants.length === 1;
                const variantTotalStock = sizes.reduce(
                  (sum, sz) => sum + (Number(variant.sizeStock?.[sz]) || 0),
                  0
                );

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[#0d0d0d] border border-[#222222] hover:border-[#333333] transition-colors space-y-4"
                  >
                    {/* Variant Header */}
                    <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: variant.hex || '#000000' }}
                        />
                        <span className="text-xs font-semibold text-gray-200">
                          Warna #{index + 1}: {variant.name || 'Belum dinamai'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        disabled={isOnlyOne}
                        className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
                        title={
                          isOnlyOne
                            ? 'Minimal harus ada 1 varian warna'
                            : 'Hapus varian warna ini'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Input fields: Name & Hex Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-gray-400 block mb-1">
                          Nama Warna *
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) =>
                            handleUpdateVariant(index, 'name', e.target.value)
                          }
                          placeholder="Contoh: Midnight Navy, Black"
                          className="input text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-400 block mb-1">
                          Kode Warna Hex
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-[#333] flex items-center justify-center bg-[#181818] cursor-pointer hover:border-gold/50 transition-colors">
                            <input
                              type="color"
                              value={
                                variant.hex && /^#[0-9A-F]{6}$/i.test(variant.hex)
                                  ? variant.hex
                                  : '#000000'
                              }
                              onChange={(e) =>
                                handleUpdateVariant(index, 'hex', e.target.value)
                              }
                              className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer opacity-0"
                              title="Klik untuk memilih warna"
                            />
                            <div
                              className="w-full h-full rounded"
                              style={{
                                backgroundColor: variant.hex || '#000000',
                              }}
                            />
                          </div>
                          <input
                            type="text"
                            value={variant.hex}
                            onChange={(e) =>
                              handleUpdateVariant(index, 'hex', e.target.value)
                            }
                            placeholder="#000000"
                            className="input text-sm font-mono flex-1 uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock per Size row (Requirement 5) */}
                    <div className="p-3.5 rounded-lg bg-[#141414] border border-[#222222] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            Stok per Ukuran *
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold font-semibold">
                            Total warna ini: {variantTotalStock} pcs
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFillingIndex(fillingIndex === index ? null : index);
                            setFillValue('');
                          }}
                          className="text-xs text-gold hover:text-white px-2.5 py-1 rounded bg-[#1c1c1c] border border-[#333] hover:border-gold/50 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          Isi semua ukuran dengan...
                        </button>
                      </div>

                      {/* Inline quick-fill bar */}
                      {fillingIndex === index && (
                        <div className="p-2.5 rounded-lg bg-[#1a1a1a] border border-gold/40 flex flex-wrap items-center gap-2 animate-fadeIn">
                          <span className="text-xs text-gray-300">
                            Isi semua ukuran warna ini:
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={fillValue}
                            onChange={(e) => setFillValue(e.target.value)}
                            placeholder="Cth: 10"
                            className="w-24 input text-xs font-mono py-1 px-2 h-7"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Math.max(0, parseInt(fillValue, 10) || 0);
                              handleFillAllSizes(index, val);
                              setFillingIndex(null);
                            }}
                            className="btn btn-primary btn-xs text-xs px-2.5 py-1 h-7"
                          >
                            Terapkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setFillingIndex(null)}
                            className="btn btn-secondary btn-xs text-xs px-2 py-1 h-7 text-gray-400"
                          >
                            Batal
                          </button>
                        </div>
                      )}

                      {/* Sizes grid */}
                      {sizes.length === 0 ? (
                        <p className="text-xs text-amber-400">
                          Belum ada ukuran produk. Silakan tambahkan ukuran pada kolom di atas.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                          {sizes.map((sz) => {
                            const val = variant.sizeStock?.[sz];
                            const isCellInvalid =
                              val === undefined ||
                              val === null ||
                              (val as unknown) === '' ||
                              Number(val) < 0 ||
                              !Number.isInteger(Number(val));

                            return (
                              <div
                                key={sz}
                                className="p-2 rounded bg-[#0d0d0d] border border-[#242424] space-y-1"
                              >
                                <span className="text-[11px] font-semibold text-gray-300 block text-center font-mono">
                                  {sz}
                                </span>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step={1}
                                    value={val ?? ''}
                                    onChange={(e) =>
                                      handleUpdateSizeStock(
                                        index,
                                        sz,
                                        e.target.value
                                      )
                                    }
                                    onFocus={(e) => e.target.select()}
                                    placeholder="0"
                                    className={`input text-center text-xs font-mono h-8 w-full py-1 px-2 ${
                                      isCellInvalid && stockErrors[index]
                                        ? 'border-rose-500 focus:border-rose-500 bg-rose-500/10'
                                        : ''
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Stock validation error under card (Requirement 8) */}
                    {stockErrors[index] && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{stockErrors[index]}</span>
                      </div>
                    )}

                    {/* Multi-image selection & upload for this variant */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-gray-300">
                          Foto Produk untuk Varian Ini *
                        </label>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            variant.images.length > 0
                              ? 'bg-gold/10 text-gold border border-gold/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {variant.images.length}/6 foto
                        </span>
                      </div>

                      {/* Reusable ImageUploader in Multiple Mode */}
                      <ImageUploader
                        multiple
                        value={variant.images}
                        onChange={(newImages) => {
                          handleUpdateVariant(index, 'images', newImages);
                        }}
                        maxFiles={6}
                        presetImages={availableImages}
                        presetTitle="Atau pilih dari foto yang sudah ada"
                        disabled={submitting}
                      />

                      {variant.images.length === 0 && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Varian warna ini belum memiliki foto. Minimal harus ada 1 foto sebelum disimpan.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 6: Short Description */}
          <div>
            <label className="input-label">Ringkasan Singkat (Opsional)</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ringkasan 1-2 kalimat yang tampil di kartu produk"
              className="input text-sm"
            />
          </div>

          {/* Row 6b: Description */}
          <div>
            <label className="input-label" htmlFor="product-description">
              Deskripsi Produk *
            </label>
            <textarea
              id="product-description"
              rows={4}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (descError) setDescError('');
              }}
              placeholder="Deskripsi keunggulan bahan, potongan jahitan, dan karakteristik busana mewah..."
              className={`input textarea text-sm resize-y ${
                descError ? 'border-rose-500' : ''
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-rose-400">{descError}</span>
              <span className="text-xs text-gray-500">
                {description.length} karakter
              </span>
            </div>
          </div>

          {/* Row 7: Primary Product Image (Catalog Card) */}
          <div className="space-y-3">
            <div>
              <label className="input-label">
                Gambar Utama Produk (Katalog) *
              </label>
              <p className="text-[11px] text-gray-400">
                Foto ini digunakan sebagai gambar sampul utama pada etalase katalog produk.
              </p>
            </div>

            <ImageUploader
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                if (imageError) setImageError('');
              }}
              label="Gambar Utama Produk"
              disabled={submitting}
            />
            {imageError && (
              <p className="text-xs text-rose-400 font-medium">{imageError}</p>
            )}

            {/* Quick preset selector */}
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] space-y-2">
              <span className="text-xs font-medium text-gray-300 block">
                Atau pilih dari foto yang sudah ada:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {availableImages.map((img) => {
                  const isSelected = imageUrl === img;
                  return (
                    <button
                      type="button"
                      key={img}
                      onClick={() => {
                        setImageUrl(img);
                        if (imageError) setImageError('');
                      }}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border transition-all shrink-0 ${
                        isSelected
                          ? 'border-gold ring-2 ring-gold/50 shadow-gold scale-105 opacity-100'
                          : 'border-[#333] opacity-45 hover:opacity-100'
                      }`}
                      title={isSelected ? 'Foto ini sedang aktif' : 'Pilih foto ini'}
                    >
                      <Image
                        src={img}
                        alt="thumbnail"
                        fill
                        className="object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-gold text-black flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Removing Size with active stock (Requirement 6) */}
      {pendingDeleteSize && (
        <Modal
          isOpen={Boolean(pendingDeleteSize)}
          onClose={() => {
            setSizesInput(sizes.join(', '));
            setPendingDeleteSize(null);
          }}
          title="Konfirmasi Hapus Ukuran"
          subtitle="Peringatan penghapusan ukuran dengan stok aktif"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setSizesInput(sizes.join(', '));
                  setPendingDeleteSize(null);
                }}
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmRemoveSize(pendingDeleteSize.size)}
                className="btn btn-sm bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                Hapus Ukuran
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold text-rose-200 text-sm">
                  Stok ukuran ini akan ikut terhapus
                </p>
                <p className="text-gray-300">
                  Ukuran <strong className="text-white font-mono">"{pendingDeleteSize.size}"</strong> saat ini masih memiliki total stok sebanyak{' '}
                  <strong className="text-amber-300 font-mono font-bold">
                    {pendingDeleteSize.stock} pcs
                  </strong>{' '}
                  pada varian warna produk ini.
                </p>
                <p className="text-gray-400">
                  Apakah Anda yakin ingin menghapus ukuran ini? Data stok untuk ukuran tersebut akan ikut terhapus di seluruh varian warna.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
