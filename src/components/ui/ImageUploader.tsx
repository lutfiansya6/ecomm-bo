'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  UploadCloud,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';

export interface BaseImageUploaderProps {
  label?: string;
  description?: string;
  disabled?: boolean;
  maxFiles?: number;
  presetImages?: string[];
  collapsiblePresets?: boolean;
  presetTitle?: string;
}

export interface SingleImageUploaderProps extends BaseImageUploaderProps {
  multiple?: false;
  value: string;
  onChange: (url: string) => void;
}

export interface MultipleImageUploaderProps extends BaseImageUploaderProps {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
}

export type ImageUploaderProps = SingleImageUploaderProps | MultipleImageUploaderProps;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

interface UploadingItem {
  id: string;
  blobUrl: string;
  name: string;
}

export function ImageUploader(props: ImageUploaderProps) {
  const {
    multiple = false,
    label,
    description,
    disabled = false,
    maxFiles = multiple ? 6 : 1,
    presetImages = [],
    collapsiblePresets = true,
    presetTitle = 'Atau pilih dari foto yang sudah ada',
  } = props;

  const valueArray = multiple
    ? Array.isArray(props.value)
      ? props.value
      : props.value
      ? [props.value]
      : []
    : [];
  const singleValue = !multiple && typeof props.value === 'string' ? props.value : '';

  const onChangeSingle = !multiple ? (props.onChange as (url: string) => void) : undefined;
  const onChangeMulti = multiple ? (props.onChange as (urls: string[]) => void) : undefined;

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempPreview, setTempPreview] = useState<string | null>(null);
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // Drag and drop reordering state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when unmounting or finished
  useEffect(() => {
    return () => {
      if (tempPreview && tempPreview.startsWith('blob:')) {
        URL.revokeObjectURL(tempPreview);
      }
      uploadingItems.forEach((item) => {
        if (item.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.blobUrl);
        }
      });
    };
  }, [tempPreview, uploadingItems]);

  const validateFile = (file: File): string | null => {
    if (!file) return 'Berkas tidak ditemukan.';
    if (file.size === 0) return `File "${file.name}" kosong (0 byte).`;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `Ukuran file "${file.name}" terlalu besar (${sizeMb} MB). Maksimal ukuran file adalah 5 MB.`;
    }

    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      return `Format file "${file.name}" tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.`;
    }

    return null;
  };

  const handleProcessFiles = async (files: File[]) => {
    setErrorMessage('');
    if (!files || files.length === 0) return;

    if (multiple) {
      const currentCount = valueArray.length + uploadingItems.length;
      const remainingSlots = maxFiles - currentCount;

      if (remainingSlots <= 0) {
        setErrorMessage(`Maksimal ${maxFiles} foto per warna telah tercapai.`);
        return;
      }

      let filesToProcess = files;
      const initialNotices: string[] = [];

      if (files.length > remainingSlots) {
        filesToProcess = files.slice(0, remainingSlots);
        initialNotices.push(
          `Maksimal ${maxFiles} foto per warna. Hanya ${remainingSlots} berkas pertama yang diproses.`
        );
      }

      // 1. Client-side validation per file
      const validFiles: File[] = [];
      const clientErrors: string[] = [...initialNotices];

      for (const f of filesToProcess) {
        const err = validateFile(f);
        if (err) {
          clientErrors.push(err);
        } else {
          validFiles.push(f);
        }
      }

      if (validFiles.length === 0) {
        setErrorMessage(clientErrors.join('\n'));
        return;
      }

      // 2. Create immediate local previews with loading cards
      const newItems: UploadingItem[] = validFiles.map((f) => ({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        blobUrl: URL.createObjectURL(f),
        name: f.name,
      }));

      setUploadingItems((prev) => [...prev, ...newItems]);

      // 3. Upload all valid files to backend POST /api/upload
      const successfulUrls: string[] = [];
      const uploadErrors: string[] = [...clientErrors];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const item = newItems[i];

        try {
          const res = await api.upload(file);
          if (res.success && res.data?.url) {
            successfulUrls.push(res.data.url);
          } else {
            const serverErr =
              res.error ||
              (res as { message?: string }).message ||
              'Server menolak berkas unggahan.';
            uploadErrors.push(`Berkas "${file.name}" gagal: ${serverErr}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Koneksi jaringan terputus';
          uploadErrors.push(`Berkas "${file.name}" gagal: ${msg}`);
        } finally {
          URL.revokeObjectURL(item.blobUrl);
          setUploadingItems((prev) => prev.filter((p) => p.id !== item.id));
        }
      }

      // 4. Save successful URLs into state (even if other files had errors)
      if (successfulUrls.length > 0 && onChangeMulti) {
        onChangeMulti([...valueArray, ...successfulUrls]);
      }

      if (uploadErrors.length > 0) {
        setErrorMessage(uploadErrors.join('\n'));
      }
    } else {
      // Single Mode
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      const localBlobUrl = URL.createObjectURL(file);
      setTempPreview(localBlobUrl);
      setIsUploading(true);

      try {
        const res = await api.upload(file);
        if (res.success && res.data?.url) {
          if (onChangeSingle) onChangeSingle(res.data.url);
          setErrorMessage('');
        } else {
          const serverErr =
            res.error ||
            (res as { message?: string }).message ||
            'Server menolak berkas unggahan.';
          setErrorMessage(`Gagal mengunggah ke server: ${serverErr}`);
          setTempPreview(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi gangguan jaringan saat mengunggah.';
        setErrorMessage(`Koneksi gagal: ${msg}`);
        setTempPreview(null);
      } finally {
        setIsUploading(false);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleProcessFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length > 0) {
      handleProcessFiles(files);
    }
  };

  // Single mode remove
  const handleRemoveSingle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tempPreview && tempPreview.startsWith('blob:')) {
      URL.revokeObjectURL(tempPreview);
    }
    setTempPreview(null);
    setErrorMessage('');
    if (onChangeSingle) onChangeSingle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Multiple mode reordering
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (!multiple || !onChangeMulti) return;
    if (toIndex < 0 || toIndex >= valueArray.length) return;
    const updated = [...valueArray];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChangeMulti(updated);
  };

  // Multiple mode remove item
  const handleRemoveMultiItem = (index: number) => {
    if (!multiple || !onChangeMulti) return;
    const updated = valueArray.filter((_, i) => i !== index);
    onChangeMulti(updated);
  };

  // Drag and drop reordering between thumbnails
  const handleThumbDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleThumbDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleThumbDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    if (dragIndex !== null && dragIndex !== targetIndex) {
      handleMove(dragIndex, targetIndex);
    }
    setDragIndex(null);
  };

  // Preset toggle
  const handleTogglePreset = (imgUrl: string) => {
    if (!multiple) {
      if (onChangeSingle) onChangeSingle(imgUrl);
      return;
    }
    if (!onChangeMulti) return;

    const isSelected = valueArray.includes(imgUrl);
    if (isSelected) {
      onChangeMulti(valueArray.filter((u) => u !== imgUrl));
    } else {
      if (valueArray.length >= maxFiles) {
        setErrorMessage(`Maksimal ${maxFiles} foto per warna telah tercapai.`);
        return;
      }
      onChangeMulti([...valueArray, imgUrl]);
    }
  };

  const activeSingleImage = tempPreview || singleValue;

  return (
    <div className="space-y-3">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* MULTIPLE MODE */}
      {multiple ? (
        <div className="space-y-3">
          {/* Thumbnails Row / Grid */}
          {(valueArray.length > 0 || uploadingItems.length > 0) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {valueArray.map((imgUrl, index) => {
                const isPrimary = index === 0;
                const isDragged = dragIndex === index;
                const isTarget = dragOverIndex === index;

                return (
                  <div
                    key={`${imgUrl}_${index}`}
                    draggable={!disabled}
                    onDragStart={(e) => handleThumbDragStart(e, index)}
                    onDragOver={(e) => handleThumbDragOver(e, index)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => handleThumbDrop(e, index)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border overflow-hidden bg-[#0a0a0a] group transition-all select-none ${
                      isTarget
                        ? 'border-gold ring-2 ring-gold/60 scale-105'
                        : isPrimary
                        ? 'border-gold/80 ring-1 ring-gold/30 shadow-gold'
                        : 'border-[#2d2d2d] hover:border-[#404040]'
                    } ${isDragged ? 'opacity-40' : 'opacity-100'} ${
                      disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                    title={`Foto #${index + 1}${
                      isPrimary ? ' (Foto Utama)' : ''
                    } - Seret atau gunakan tombol panah untuk mengubah urutan`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Foto varian ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge ("Utama") */}
                    {isPrimary && (
                      <div className="absolute top-1 left-1 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 pointer-events-none tracking-wider uppercase">
                        Utama
                      </div>
                    )}

                    {/* Delete (X) Button */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMultiItem(index);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-rose-500 text-gray-300 hover:text-white flex items-center justify-center transition-colors shadow z-10"
                        title="Hapus foto ini"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}

                    {/* Left & Right Reorder Buttons Overlay */}
                    {!disabled && valueArray.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 py-0.5 px-1 bg-black/85 backdrop-blur-xs flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(index, index - 1);
                          }}
                          className="p-0.5 text-gray-300 hover:text-gold disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                          title="Geser ke kiri"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-[9px] font-mono text-gray-400 font-semibold">
                          #{index + 1}
                        </span>

                        <button
                          type="button"
                          disabled={index === valueArray.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMove(index, index + 1);
                          }}
                          className="p-0.5 text-gray-300 hover:text-gold disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                          title="Geser ke kanan"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uploading Indicators */}
              {uploadingItems.map((item) => (
                <div
                  key={item.id}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-gold/50 border-dashed overflow-hidden bg-[#141414] flex flex-col items-center justify-center p-2 text-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.blobUrl}
                    alt="Uploading preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px]"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    <span className="text-[9px] font-medium text-white truncate max-w-[70px]">
                      Mengunggah
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Dropzone / Button */}
          {valueArray.length + uploadingItems.length < maxFiles ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!disabled) fileInputRef.current?.click();
              }}
              className={`rounded-xl border-2 border-dashed p-3.5 sm:p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/30'
                  : 'border-[#2c2c2c] hover:border-gold/60 bg-[#121212] hover:bg-[#161616]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold border border-gold/20 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>

                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) fileInputRef.current?.click();
                      }}
                      disabled={disabled}
                      className="btn btn-primary btn-sm text-xs py-1 px-3 flex items-center gap-1.5 shadow-gold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Unggah Foto dari Komputer</span>
                    </button>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      atau tarik file ke sini
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-1">
                    Boleh memilih beberapa sekaligus (JPG, PNG, WEBP, maks. 5MB) • Sisa{' '}
                    <span className="text-gold font-medium">
                      {maxFiles - valueArray.length - uploadingItems.length} slot
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-xs text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Maksimal {maxFiles} foto telah tercapai.</span>
              </span>
              <span className="text-[11px] text-gray-500">
                Hapus salah satu foto di atas untuk mengganti.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* SINGLE MODE (for primary catalog image) */
        <div>
          {activeSingleImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl border overflow-hidden bg-[#0a0a0a] transition-all group ${
                isDragging
                  ? 'border-gold ring-2 ring-gold/40 shadow-gold'
                  : 'border-[#262626] hover:border-[#383838]'
              }`}
            >
              {/* Top Bar with Status and Actions */}
              <div className="px-4 py-2.5 bg-[#141414] border-b border-[#222222] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-gray-300 truncate font-mono">
                    {activeSingleImage}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1.5 hover:border-gold/50 text-gray-200 hover:text-white"
                    title="Pilih foto lain dari komputer"
                  >
                    <RefreshCw className="w-3 h-3 text-gold" />
                    <span>Ganti Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveSingle}
                    disabled={disabled || isUploading}
                    className="btn btn-danger btn-sm text-xs py-1 px-2 flex items-center gap-1 hover:bg-rose-500/20 text-rose-400"
                    title="Hapus gambar ini"
                  >
                    <X className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Preview Image Display */}
              <div className="relative w-full h-56 sm:h-64 flex items-center justify-center p-4 bg-gradient-to-b from-[#111111] to-[#0a0a0a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSingleImage}
                  alt="Preview Gambar Produk"
                  className={`max-h-full max-w-full object-contain rounded-lg shadow-md transition-opacity duration-200 ${
                    isUploading ? 'opacity-30 filter blur-[1px]' : 'opacity-100'
                  }`}
                />

                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-4">
                    <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin flex items-center justify-center" />
                    <div>
                      <p className="text-sm font-semibold text-white">Mengunggah ke server...</p>
                      <p className="text-xs text-gold/80 mt-0.5">Memproses berkas gambar</p>
                    </div>
                  </div>
                )}

                {isDragging && (
                  <div className="absolute inset-0 bg-black/80 border-2 border-gold border-dashed flex flex-col items-center justify-center gap-2 text-gold">
                    <UploadCloud className="w-10 h-10 animate-bounce" />
                    <p className="text-sm font-medium">Lepaskan file di sini untuk mengganti foto</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!disabled && !isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={`relative rounded-xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/30 scale-[1.01]'
                  : 'border-[#2d2d2d] hover:border-gold/60 bg-[#111111] hover:bg-[#151515]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                  <p className="text-sm font-medium text-white">Mengunggah gambar...</p>
                  <p className="text-xs text-gray-400">Harap tunggu sebentar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold border border-gold/20 flex items-center justify-center shadow-gold group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Tarik &amp; letakkan file gambar di sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">atau</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={disabled}
                    className="btn btn-primary btn-sm flex items-center gap-2 shadow-gold"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Pilih File dari Komputer</span>
                  </button>

                  <p className="text-[11px] text-gray-500 mt-1">
                    Format: <span className="text-gray-400 font-medium">JPG, PNG, WEBP</span> (Maks. 5MB)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ERROR MESSAGE ALERT */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 whitespace-pre-line leading-relaxed">
            <p className="font-semibold mb-0.5">Pemberitahuan Berkas</p>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* COLLAPSIBLE PRESET PICKER ("Atau pilih dari foto yang sudah ada") */}
      {presetImages && presetImages.length > 0 && (
        <div className="rounded-xl border border-[#222222] bg-[#121212] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsPresetsOpen((prev) => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-300 hover:text-white hover:bg-[#181818] transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <ChevronDown
                className={`w-4 h-4 text-gold transition-transform duration-200 ${
                  isPresetsOpen ? 'rotate-180' : ''
                }`}
              />
              <span>{presetTitle}</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {presetImages.length} foto tersedia {isPresetsOpen ? '▲ Tutup' : '▼ Buka'}
            </span>
          </button>

          {isPresetsOpen && (
            <div className="p-3 border-t border-[#222222] bg-[#0d0d0d] animate-fadeIn">
              <p className="text-[11px] text-gray-400 mb-2.5">
                {multiple
                  ? `Klik foto untuk memilih atau membatalkan pilihan (maks. ${maxFiles} foto):`
                  : 'Klik foto untuk memilih sebagai gambar aktif:'}
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
                {presetImages.map((img) => {
                  const isSelected = multiple
                    ? valueArray.includes(img)
                    : singleValue === img;

                  return (
                    <button
                      type="button"
                      key={img}
                      onClick={() => handleTogglePreset(img)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border transition-all shrink-0 ${
                        isSelected
                          ? 'border-gold ring-2 ring-gold/50 shadow-gold opacity-100 scale-105'
                          : 'border-[#282828] opacity-40 hover:opacity-90'
                      }`}
                      title={
                        isSelected
                          ? 'Klik untuk membatalkan foto ini'
                          : 'Klik untuk memilih foto ini'
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt="preset thumbnail"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gold text-black flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
