import React, { useMemo, useState } from 'react';
import {
  HardDrive,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MediaAsset } from '../../types';
import { isFirebaseStorageUrl } from '../../services/firebase';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 10 || i === 0 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
}

export const StorageManagementPanel: React.FC = () => {
  const {
    mediaAssets,
    getMediaAssetUsages,
    deleteMediaAsset,
    cleanupUnusedMediaAssets,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedUnusedIds, setSelectedUnusedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<
    | { mode: 'single'; asset: MediaAsset }
    | { mode: 'bulk'; assets: MediaAsset[] }
    | null
  >(null);

  const analyzed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mediaAssets
      .map((asset) => {
        const usages = getMediaAssetUsages(asset.url);
        const isStorageFile = Boolean(asset.storagePath) || isFirebaseStorageUrl(asset.url);
        return { asset, usages, isStorageFile };
      })
      .filter(({ asset }) =>
        q ? `${asset.name} ${asset.folder} ${asset.url}`.toLowerCase().includes(q) : true
      );
  }, [mediaAssets, getMediaAssetUsages, search]);

  const stats = useMemo(() => {
    let totalBytes = 0;
    let storageCount = 0;
    let externalCount = 0;
    const inUse: typeof analyzed = [];
    const unused: typeof analyzed = [];

    mediaAssets.forEach((asset) => {
      totalBytes += asset.sizeBytes || 0;
      if (asset.storagePath || isFirebaseStorageUrl(asset.url)) {
        storageCount += 1;
      } else {
        externalCount += 1;
      }
    });

    analyzed.forEach((entry) => {
      if (entry.usages.length > 0) inUse.push(entry);
      else unused.push(entry);
    });

    const unusedBytes = unused.reduce((sum, u) => sum + (u.asset.sizeBytes || 0), 0);

    return {
      totalCount: mediaAssets.length,
      storageCount,
      externalCount,
      totalBytes,
      unusedBytes,
      inUse,
      unused,
    };
  }, [mediaAssets, analyzed]);

  const toggleUnused = (id: string) => {
    setSelectedUnusedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allUnusedSelected =
    stats.unused.length > 0 &&
    stats.unused.every((u) => selectedUnusedIds.includes(u.asset.id));

  const toggleSelectAllUnused = () => {
    if (allUnusedSelected) {
      setSelectedUnusedIds([]);
    } else {
      setSelectedUnusedIds(stats.unused.map((u) => u.asset.id));
    }
  };

  const selectedUnusedAssets = stats.unused
    .map((u) => u.asset)
    .filter((a) => selectedUnusedIds.includes(a.id));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#171C19] inline-flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#1B3B2B]" />
            <span>Storage & Media Cleanup</span>
          </h2>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Inspect uploaded Firebase Storage files, check where assets are used across your catalog and CMS, and safely remove unused files.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#5C655F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter media files..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Total Media Files
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {stats.totalCount}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">
            {stats.storageCount} Firebase Storage · {stats.externalCount} external URLs
          </p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Measured Storage Size
          </p>
          <p className="font-mono text-2xl font-semibold text-[#171C19] mt-2 tabular-nums">
            {formatBytes(stats.totalBytes)}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">Uploaded asset byte footprint</p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Protected (In Use)
          </p>
          <p className="font-mono text-2xl font-semibold text-[#1B3B2B] mt-2 tabular-nums">
            {stats.inUse.length}
          </p>
          <p className="text-xs text-[#6E8774] mt-1">Referenced by active store content</p>
        </div>

        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
            Unused (Safe to Clean)
          </p>
          <p className="font-mono text-2xl font-semibold text-amber-800 mt-2 tabular-nums">
            {stats.unused.length}
          </p>
          <p className="text-xs text-[#5C655F] mt-1">
            Reclaimable: <span className="font-mono">{formatBytes(stats.unusedBytes)}</span>
          </p>
        </div>
      </div>

      {/* Unused Files Section */}
      <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-800" />
              <span>Unused Media & Orphaned Storage Files ({stats.unused.length})</span>
            </h3>
            <p className="text-xs text-[#5C655F] mt-0.5">
              Not referenced by any product, category, banner, page, post, homepage section, or branding setting.
            </p>
          </div>

          {stats.unused.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#171C19] cursor-pointer px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
                <input
                  type="checkbox"
                  checked={allUnusedSelected}
                  onChange={toggleSelectAllUnused}
                />
                <span>Select All ({stats.unused.length})</span>
              </label>

              {selectedUnusedAssets.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({ mode: 'bulk', assets: selectedUnusedAssets })
                  }
                  className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedUnusedAssets.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {stats.unused.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C655F] inline-flex flex-col items-center w-full gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#1B3B2B]" />
            <span>No unused media files found. Storage is clean.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D6]">
            {stats.unused.map(({ asset, isStorageFile }) => {
              const checked = selectedUnusedIds.includes(asset.id);
              return (
                <div
                  key={asset.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAF8F4]/70"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUnused(asset.id)}
                      aria-label={`Select ${asset.name}`}
                    />
                    <div className="w-12 h-12 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] overflow-hidden shrink-0">
                      {asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5C655F]">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#171C19] truncate">
                        {asset.name}
                      </p>
                      <p className="text-[11px] text-[#5C655F] flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="uppercase tracking-wider text-[#6E8774] font-semibold">
                          {asset.folder}
                        </span>
                        <span>·</span>
                        <span className="font-mono">
                          {asset.sizeBytes ? formatBytes(asset.sizeBytes) : 'External / size unknown'}
                        </span>
                        <span>·</span>
                        <span>{isStorageFile ? 'Firebase Storage' : 'External URL'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-[#171C19]"
                      title="Open asset URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ mode: 'single', asset })}
                      className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Protected In-Use Files Section */}
      <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E4E0D6]">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#1B3B2B]" />
            <span>In-Use Protected Assets ({stats.inUse.length})</span>
          </h3>
          <p className="text-xs text-[#5C655F] mt-0.5">
            Deletion is disabled here for assets still referenced on your storefront so live images never break accidentally.
          </p>
        </div>

        {stats.inUse.length === 0 ? (
          <p className="p-8 text-center text-xs text-[#5C655F]">
            No matching in-use files.
          </p>
        ) : (
          <div className="divide-y divide-[#E4E0D6]">
            {stats.inUse.map(({ asset, usages, isStorageFile }) => (
              <div
                key={asset.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] overflow-hidden shrink-0">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#171C19] truncate">
                      {asset.name}
                    </p>
                    <p className="text-[11px] text-[#5C655F] mt-0.5">
                      {asset.folder} · {isStorageFile ? 'Firebase Storage' : 'External URL'}{' '}
                      {asset.sizeBytes ? `· ${formatBytes(asset.sizeBytes)}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {usages.map((u) => (
                        <span
                          key={u}
                          className="px-2 py-0.5 rounded-md bg-[#E9EFEA] text-[#1B3B2B] text-[10px] font-medium"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-lg bg-[#F3F0E8] border border-[#E4E0D6] text-[11px] font-medium text-[#5C655F] shrink-0">
                  Protected (In Use)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.mode === 'bulk'
            ? 'Delete Selected Unused Media?'
            : 'Delete Unused Media File?'
        }
        itemLabel={
          deleteTarget?.mode === 'bulk'
            ? `${deleteTarget.assets.length} unused media file(s)`
            : deleteTarget?.asset.name || ''
        }
        description={
          deleteTarget?.mode === 'bulk'
            ? 'Selected unused media records and their associated Firebase Storage objects will be permanently removed.'
            : 'This will permanently remove the Firestore media record and delete any associated file from Firebase Storage.'
        }
        warningText="Only unreferenced files are included. Active product, post, page, banner, and branding assets remain protected."
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.mode === 'single') {
            await deleteMediaAsset(deleteTarget.asset.id, deleteTarget.asset.storagePath);
            setSelectedUnusedIds((prev) => prev.filter((id) => id !== deleteTarget.asset.id));
          } else {
            await cleanupUnusedMediaAssets(deleteTarget.assets);
            const removed = new Set(deleteTarget.assets.map((a) => a.id));
            setSelectedUnusedIds((prev) => prev.filter((id) => !removed.has(id)));
          }
        }}
      />
    </div>
  );
};
