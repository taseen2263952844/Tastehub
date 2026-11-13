import React, { useState, useMemo } from 'react';
import { X, Upload, Search, Image as ImageIcon, Check, Link as LinkIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MediaAsset, MediaFolder } from '../../types';
import { uploadAssetWithPath } from '../../services/firebase';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  defaultFolder?: MediaFolder;
  title?: string;
}

const FOLDERS: { id: MediaFolder | 'all'; label: string }[] = [
  { id: 'all', label: 'All Assets' },
  { id: 'products', label: 'Products' },
  { id: 'banners', label: 'Banners' },
  { id: 'posts', label: 'Posts' },
  { id: 'pages', label: 'Pages' },
  { id: 'branding', label: 'Branding' },
  { id: 'general', label: 'General' },
];

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  defaultFolder = 'general',
  title = 'Select Media Asset',
}) => {
  const { mediaAssets, saveMediaAsset, currentUser, showToast } = useApp();
  const [folderFilter, setFolderFilter] = useState<MediaFolder | 'all'>('all');
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>(defaultFolder);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mediaAssets.filter((a) => {
      if (folderFilter !== 'all' && a.folder !== folderFilter) return false;
      if (q && !`${a.name} ${a.folder} ${a.url}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mediaAssets, folderFilter, search]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, storagePath } = await uploadAssetWithPath(file, uploadFolder);
      const asset: MediaAsset = {
        id: `media-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        folder: uploadFolder,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        storagePath,
        uploadedBy: currentUser?.email || '',
        createdAt: new Date().toISOString(),
      };
      await saveMediaAsset(asset);
      onSelect(url);
      onClose();
    } catch (err: any) {
      showToast(
        err?.message ||
          'Storage upload failed. Ensure Firebase Storage is enabled or save an image URL below.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveExternalUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    const asset: MediaAsset = {
      id: `media-${Date.now()}`,
      name: nameInput.trim() || 'External Image',
      url: cleanUrl,
      folder: uploadFolder,
      mimeType: 'image/external',
      uploadedBy: currentUser?.email || '',
      createdAt: new Date().toISOString(),
    };
    await saveMediaAsset(asset);
    onSelect(cleanUrl);
    setUrlInput('');
    setNameInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E0D6] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-[#1B3B2B]" />
            <h3 className="font-serif text-xl font-semibold text-[#171C19]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C655F] hover:text-[#171C19] hover:bg-[#F3F0E8]"
            aria-label="Close media picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & URL Bar */}
        <div className="p-4 border-b border-[#E4E0D6] bg-white space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
              className="px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19]"
              aria-label="Upload folder"
            >
              {FOLDERS.filter((f) => f.id !== 'all').map((f) => (
                <option key={f.id} value={f.id}>
                  Folder: {f.label}
                </option>
              ))}
            </select>

            <label className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 hover:bg-[#142D20]">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <form onSubmit={handleSaveExternalUrl} className="flex flex-1 min-w-[260px] gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-[#5C655F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste HTTPS image URL to add & select..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
              </div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Label (optional)"
                className="w-32 hidden sm:block px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#E9EFEA] shrink-0"
              >
                Use URL
              </button>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {FOLDERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFolderFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                    folderFilter === f.id
                      ? 'bg-[#1B3B2B] text-[#FAF8F4] border-[#1B3B2B]'
                      : 'bg-[#FAF8F4] text-[#5C655F] border-[#E4E0D6] hover:text-[#171C19]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#5C655F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search media..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAF8F4]">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#5C655F]">
              No matching images in the Media Library. Upload an image or add an HTTPS URL above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset.url);
                    onClose();
                  }}
                  className="group text-left bg-white border border-[#E4E0D6] rounded-xl overflow-hidden hover:border-[#1B3B2B] transition-colors flex flex-col"
                >
                  <div className="aspect-square w-full bg-[#F3F0E8] overflow-hidden relative">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-[#1B3B2B]/0 group-hover:bg-[#1B3B2B]/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-[#1B3B2B] text-white text-[11px] font-medium px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Select
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-[#171C19] truncate">{asset.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#6E8774]">
                      {asset.folder}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
