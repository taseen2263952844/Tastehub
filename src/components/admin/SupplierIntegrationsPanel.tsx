import React, { useMemo, useState } from 'react';
import {
  PlugZap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  SlidersHorizontal,
  Shield,
  PackagePlus,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Plus,
  Star,
  Clock,
  Info,
} from 'lucide-react';
import { useApp, formatBDT } from '../../context/AppContext';
import {
  Product,
  SupplierImportLog,
  SupplierIntegrationConfig,
  SupplierMarkupType,
} from '../../types';
import {
  ResellHatProductItem,
  buildImportedProductFromSupplier,
  buildSyncedProductUpdate,
  calculateProfitSummary,
  calculateSellingPrice,
  fetchResellHatProductsPage,
  mapResellHatCategoryToVeyra,
  testResellHatConnection,
} from '../../services/resellhat';

const DEFAULT_CONFIG: SupplierIntegrationConfig = {
  id: 'resellhat',
  supplierName: 'ResellHat',
  status: 'unconfigured',
  defaultMarkupType: 'percentage',
  defaultMarkupValue: 30,
  defaultCategoryId: 'electronics-gadgets',
  defaultPublishStatus: 'draft',
  importedCount: 0,
};

export const SupplierIntegrationsPanel: React.FC = () => {
  const {
    products,
    categories,
    currentUser,
    supplierIntegrations,
    supplierImportLogs,
    saveProduct,
    batchSaveProducts,
    saveSupplierIntegration,
    saveSupplierImportLog,
    deleteSupplierImportLog,
    showToast,
  } = useApp();

  const savedConfig = useMemo<SupplierIntegrationConfig>(() => {
    const found = supplierIntegrations.find((c) => c.id === 'resellhat');
    return found ? { ...DEFAULT_CONFIG, ...found } : DEFAULT_CONFIG;
  }, [supplierIntegrations]);

  // Pricing & Default Config State
  const [markupType, setMarkupType] = useState<SupplierMarkupType>(savedConfig.defaultMarkupType);
  const [markupValue, setMarkupValue] = useState<number>(savedConfig.defaultMarkupValue);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>(
    savedConfig.defaultCategoryId || categories[0]?.slug || 'electronics-gadgets'
  );
  const [defaultPublishStatus, setDefaultPublishStatus] = useState<'draft' | 'published'>(
    savedConfig.defaultPublishStatus || 'draft'
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Connection & Catalog Browsing State
  const [testingConn, setTestingConn] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<ResellHatProductItem[]>([]);
  const [discoveredCategories, setDiscoveredCategories] = useState<string[]>([]);
  const [pageMeta, setPageMeta] = useState({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [perPage, setPerPage] = useState<number>(50);
  const [selectedSupplierCategory, setSelectedSupplierCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Single Product Review Modal State
  const [reviewItem, setReviewItem] = useState<ResellHatProductItem | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewShortDesc, setReviewShortDesc] = useState('');
  const [reviewDesc, setReviewDesc] = useState('');
  const [reviewCategoryId, setReviewCategoryId] = useState('');
  const [reviewMarkupType, setReviewMarkupType] = useState<SupplierMarkupType>('percentage');
  const [reviewMarkupVal, setReviewMarkupVal] = useState<number>(30);
  const [reviewCustomPrice, setReviewCustomPrice] = useState<number>(0);
  const [reviewFeatured, setReviewFeatured] = useState(false);
  const [reviewPublish, setReviewPublish] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewNewImageUrl, setReviewNewImageUrl] = useState('');
  const [savingSingle, setSavingSingle] = useState(false);

  // Bulk / Category / Sync Job State
  const [bulkJobActive, setBulkJobActive] = useState(false);
  const [bulkJobTitle, setBulkJobTitle] = useState('');
  const [bulkProgressText, setBulkProgressText] = useState('');
  const [bulkProgressPct, setBulkProgressPct] = useState(0);
  const [isCategoryImportModalOpen, setIsCategoryImportModalOpen] = useState(false);
  const [categoryImportTarget, setCategoryImportTarget] = useState<string>('all');
  const [categoryImportOverwrite, setCategoryImportOverwrite] = useState(false);
  const [categoryImportPublish, setCategoryImportPublish] = useState<'draft' | 'published'>('draft');
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncRecalculatePrices, setSyncRecalculatePrices] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Existing ResellHat products lookup map by supplierProductId
  const importedBySupplierId = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.supplierName === 'ResellHat' && p.supplierProductId) {
        map.set(p.supplierProductId, p);
      }
    });
    return map;
  }, [products]);

  const importedCount = importedBySupplierId.size;

  const filteredCatalog = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter((item) =>
      `${item.name} ${item.supplierProductId} ${item.sku} ${item.category}`.toLowerCase().includes(q)
    );
  }, [catalogItems, searchTerm]);

  const handleSaveDefaults = async () => {
    setSavingConfig(true);
    try {
      await saveSupplierIntegration({
        ...savedConfig,
        defaultMarkupType: markupType,
        defaultMarkupValue: Math.max(0, Number(markupValue) || 0),
        defaultCategoryId,
        defaultPublishStatus,
        importedCount,
      });
      showToast('ResellHat pricing & import defaults saved');
    } catch {
      // handled by context
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setTestFeedback(null);
    const nowIso = new Date().toISOString();
    try {
      const res = await testResellHatConnection();
      setTestFeedback({ ok: true, message: res.message });
      await saveSupplierIntegration({
        ...savedConfig,
        status: 'connected',
        lastTestedAt: nowIso,
        lastError: '',
        defaultMarkupType: markupType,
        defaultMarkupValue: markupValue,
        defaultCategoryId,
        defaultPublishStatus,
        importedCount,
      });
      showToast('ResellHat API connection verified');
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect to ResellHat API.';
      setTestFeedback({ ok: false, message: msg });
      const missingKey = (err?.code || '') === 'MISSING_API_KEY';
      await saveSupplierIntegration({
        ...savedConfig,
        status: missingKey ? 'unconfigured' : 'error',
        lastTestedAt: nowIso,
        lastError: msg.slice(0, 480),
        defaultMarkupType: markupType,
        defaultMarkupValue: markupValue,
        defaultCategoryId,
        defaultPublishStatus,
        importedCount,
      }).catch(() => {});
    } finally {
      setTestingConn(false);
    }
  };

  const loadSupplierPage = async (targetPage = 1, categoryOverride?: string, perPageOverride?: number) => {
    const cat = categoryOverride ?? selectedSupplierCategory;
    const size = perPageOverride ?? perPage;
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const res = await fetchResellHatProductsPage({
        page: targetPage,
        perPage: size,
        category: cat,
      });
      setCatalogItems(res.data);
      setPageMeta(res.meta);
      setSelectedIds([]);
      setDiscoveredCategories((prev) => {
        const merged = new Set([...prev, ...(res.categories || [])]);
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
      });
      if (savedConfig.status !== 'connected') {
        await saveSupplierIntegration({
          ...savedConfig,
          status: 'connected',
          lastTestedAt: new Date().toISOString(),
          lastError: '',
          importedCount,
        }).catch(() => {});
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to load ResellHat catalog.';
      setCatalogError(msg);
      showToast(msg);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const openReviewModal = (item: ResellHatProductItem) => {
    const existing = importedBySupplierId.get(item.supplierProductId);
    const mappedCat = mapResellHatCategoryToVeyra(item.category, categories, defaultCategoryId);
    const mType: SupplierMarkupType =
      existing?.supplierMarkupType || (markupType === 'custom' ? 'percentage' : markupType);
    const mVal = existing?.supplierMarkupValue ?? markupValue;
    const initialSelling = existing
      ? existing.price
      : calculateSellingPrice(item.supplierPrice, mType, mVal);

    setReviewItem(item);
    setReviewTitle(existing?.name || item.name);
    setReviewShortDesc(existing?.shortDescription || item.shortDescription);
    setReviewDesc(existing?.description || item.description);
    setReviewCategoryId(existing?.categoryId || mappedCat.slug);
    setReviewMarkupType(existing ? 'custom' : mType);
    setReviewMarkupVal(mVal);
    setReviewCustomPrice(initialSelling);
    setReviewFeatured(existing?.isFeatured || false);
    setReviewPublish(existing ? existing.isActive : defaultPublishStatus === 'published');
    setReviewImages(existing?.images?.length ? [...existing.images] : [...item.images]);
    setReviewNewImageUrl('');
  };

  const reviewComputedPrice = useMemo(() => {
    if (!reviewItem) return 0;
    return calculateSellingPrice(
      reviewItem.supplierPrice,
      reviewMarkupType,
      reviewMarkupVal,
      reviewCustomPrice
    );
  }, [reviewItem, reviewMarkupType, reviewMarkupVal, reviewCustomPrice]);

  const handleSaveReviewedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;
    setSavingSingle(true);
    try {
      const existing = importedBySupplierId.get(reviewItem.supplierProductId);
      const chosenCat =
        categories.find((c) => c.slug === reviewCategoryId) ||
        mapResellHatCategoryToVeyra(reviewItem.category, categories, defaultCategoryId);

      const finalProduct = buildImportedProductFromSupplier({
        item: reviewItem,
        title: reviewTitle,
        shortDescription: reviewShortDesc,
        description: reviewDesc,
        category: chosenCat,
        sellingPrice: reviewComputedPrice,
        markupType: reviewMarkupType,
        markupValue: reviewMarkupType === 'custom' ? reviewComputedPrice : reviewMarkupVal,
        isFeatured: reviewFeatured,
        isActive: reviewPublish,
        images: reviewImages,
        existingProduct: existing,
      });

      await saveProduct(finalProduct);
      const nowIso = new Date().toISOString();
      await saveSupplierImportLog({
        id: `imp-${Date.now()}`,
        supplierName: 'ResellHat',
        mode: 'selected',
        categoryFilter: reviewItem.category,
        totalProcessed: 1,
        createdCount: existing ? 0 : 1,
        updatedCount: existing ? 1 : 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [],
        triggeredBy: currentUser?.email || 'admin',
        createdAt: nowIso,
      });
      await saveSupplierIntegration({
        ...savedConfig,
        status: 'connected',
        lastSyncedAt: nowIso,
        importedCount: existing ? importedCount : importedCount + 1,
      });
      setReviewItem(null);
      showToast(
        `${existing ? 'Updated' : 'Imported'} "${finalProduct.name}" (${
          finalProduct.isActive ? 'Published' : 'Saved as Draft'
        })`
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to save imported product.');
    } finally {
      setSavingSingle(false);
    }
  };

  const handleImportSelectedOnPage = async () => {
    const selectedItems = catalogItems.filter((item) => selectedIds.includes(item.supplierProductId));
    if (selectedItems.length === 0) return;

    if (selectedItems.length === 1) {
      openReviewModal(selectedItems[0]);
      return;
    }

    setBulkJobActive(true);
    setBulkJobTitle(`Importing ${selectedItems.length} Selected ResellHat Products`);
    setBulkProgressText('Preparing product payloads...');
    setBulkProgressPct(25);

    const effectiveMarkupType: SupplierMarkupType =
      markupType === 'custom' ? 'percentage' : markupType;
    const toWrite: Product[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const item of selectedItems) {
      try {
        const existing = importedBySupplierId.get(item.supplierProductId);
        const cat = mapResellHatCategoryToVeyra(item.category, categories, defaultCategoryId);
        const price = calculateSellingPrice(item.supplierPrice, effectiveMarkupType, markupValue);
        const built = buildImportedProductFromSupplier({
          item,
          category: cat,
          sellingPrice: existing ? existing.price : price,
          markupType: existing?.supplierMarkupType || effectiveMarkupType,
          markupValue: existing?.supplierMarkupValue ?? markupValue,
          isActive: existing ? existing.isActive : defaultPublishStatus === 'published',
          existingProduct: existing,
        });
        toWrite.push(built);
        if (existing) updatedCount += 1;
        else createdCount += 1;
      } catch (err: any) {
        errors.push(`${item.name}: ${err?.message || 'Mapping error'}`);
      }
    }

    try {
      setBulkProgressText(`Saving ${toWrite.length} product(s) to Cloud Firestore...`);
      setBulkProgressPct(70);
      await batchSaveProducts(toWrite);

      const nowIso = new Date().toISOString();
      await saveSupplierImportLog({
        id: `imp-${Date.now()}`,
        supplierName: 'ResellHat',
        mode: 'selected',
        totalProcessed: selectedItems.length,
        createdCount,
        updatedCount,
        skippedCount: 0,
        failedCount: errors.length,
        errors: errors.slice(0, 25),
        triggeredBy: currentUser?.email || 'admin',
        createdAt: nowIso,
      });

      await saveSupplierIntegration({
        ...savedConfig,
        status: 'connected',
        lastSyncedAt: nowIso,
        importedCount: importedCount + createdCount,
      });

      setBulkProgressPct(100);
      setSelectedIds([]);
      showToast(`Imported ${createdCount} new & updated ${updatedCount} product(s)`);
    } catch (err: any) {
      showToast(err?.message || 'Bulk import failed.');
    } finally {
      setBulkJobActive(false);
    }
  };

  // Controlled pagination across meta.last_page (per_page <= 500) for Category / Bulk import
  const handleRunCategoryBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCategoryImportModalOpen(false);
    setBulkJobActive(true);
    const catLabel = categoryImportTarget === 'all' ? 'All Categories' : categoryImportTarget;
    setBulkJobTitle(`Importing ResellHat Catalog (${catLabel})`);
    setBulkProgressText('Fetching page 1 (per_page=500)...');
    setBulkProgressPct(5);

    const effectiveMarkupType: SupplierMarkupType =
      markupType === 'custom' ? 'percentage' : markupType;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let totalProcessed = 0;
    const errors: string[] = [];

    try {
      let currentPage = 1;
      let lastPage = 1;
      const workingExistingMap = new Map(importedBySupplierId);

      do {
        setBulkProgressText(`Fetching page ${currentPage} of ${lastPage} (up to 500 items/page)...`);
        const res = await fetchResellHatProductsPage({
          page: currentPage,
          perPage: 500,
          category: categoryImportTarget,
        });
        lastPage = Math.max(1, res.meta.last_page || 1);

        const batchProducts: Product[] = [];
        for (const item of res.data) {
          totalProcessed += 1;
          const existing = workingExistingMap.get(item.supplierProductId);
          if (existing && !categoryImportOverwrite) {
            skippedCount += 1;
            continue;
          }

          try {
            const mappedCat = mapResellHatCategoryToVeyra(
              item.category,
              categories,
              defaultCategoryId
            );
            const sellingPrice = calculateSellingPrice(
              item.supplierPrice,
              effectiveMarkupType,
              markupValue
            );
            const built = buildImportedProductFromSupplier({
              item,
              category: mappedCat,
              sellingPrice: existing && !categoryImportOverwrite ? existing.price : sellingPrice,
              markupType: effectiveMarkupType,
              markupValue,
              isActive:
                existing !== undefined
                  ? existing.isActive
                  : categoryImportPublish === 'published',
              existingProduct: existing,
            });
            batchProducts.push(built);
            workingExistingMap.set(item.supplierProductId, built);
            if (existing) updatedCount += 1;
            else createdCount += 1;
          } catch (itemErr: any) {
            errors.push(`${item.name}: ${itemErr?.message || 'Invalid product'}`);
          }
        }

        if (batchProducts.length > 0) {
          setBulkProgressText(
            `Writing page ${currentPage}/${lastPage} (${batchProducts.length} items) to Firestore...`
          );
          await batchSaveProducts(batchProducts);
        }

        setBulkProgressPct(Math.min(95, Math.round((currentPage / lastPage) * 90)));
        currentPage += 1;
      } while (currentPage <= lastPage);

      const nowIso = new Date().toISOString();
      await saveSupplierImportLog({
        id: `imp-${Date.now()}`,
        supplierName: 'ResellHat',
        mode: 'category',
        categoryFilter: catLabel,
        totalProcessed,
        createdCount,
        updatedCount,
        skippedCount,
        failedCount: errors.length,
        errors: errors.slice(0, 25),
        triggeredBy: currentUser?.email || 'admin',
        createdAt: nowIso,
      });

      await saveSupplierIntegration({
        ...savedConfig,
        status: 'connected',
        lastSyncedAt: nowIso,
        importedCount: workingExistingMap.size,
      });

      setBulkProgressPct(100);
      showToast(
        `Category import complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`
      );
    } catch (err: any) {
      errors.push(err?.message || 'Import interrupted');
      showToast(err?.message || 'Category bulk import failed.');
    } finally {
      setBulkJobActive(false);
    }
  };

  // Manual non-destructive synchronization across ResellHat catalog pages
  const handleRunManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncModalOpen(false);

    if (importedBySupplierId.size === 0) {
      showToast('No ResellHat products have been imported into VEYRA yet.');
      return;
    }

    setBulkJobActive(true);
    setBulkJobTitle('Synchronizing Imported ResellHat Products');
    setBulkProgressText('Fetching supplier catalog page 1...');
    setBulkProgressPct(10);

    const effectiveMarkupType: SupplierMarkupType =
      markupType === 'custom' ? 'percentage' : markupType;
    let totalProcessed = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    try {
      const upstreamById = new Map<string, ResellHatProductItem>();
      let page = 1;
      let lastPage = 1;

      do {
        setBulkProgressText(`Scanning ResellHat page ${page} of ${lastPage}...`);
        const res = await fetchResellHatProductsPage({ page, perPage: 500 });
        lastPage = Math.max(1, res.meta.last_page || 1);
        res.data.forEach((item) => upstreamById.set(item.supplierProductId, item));
        setBulkProgressPct(Math.round((page / lastPage) * 60));
        page += 1;
      } while (page <= lastPage);

      const updates: Product[] = [];
      importedBySupplierId.forEach((existing, supId) => {
        totalProcessed += 1;
        const upstream = upstreamById.get(supId);
        if (!upstream) {
          skippedCount += 1;
          return;
        }
        try {
          updates.push(
            buildSyncedProductUpdate(existing, upstream, {
              recalculateSellingPrice: syncRecalculatePrices,
              fallbackMarkupType: effectiveMarkupType,
              fallbackMarkupValue: markupValue,
            })
          );
          updatedCount += 1;
        } catch (err: any) {
          errors.push(`${existing.name}: ${err?.message || 'Sync error'}`);
        }
      });

      if (updates.length > 0) {
        setBulkProgressText(`Updating ${updates.length} synchronized product(s) in Firestore...`);
        setBulkProgressPct(85);
        await batchSaveProducts(updates);
      }

      const nowIso = new Date().toISOString();
      await saveSupplierImportLog({
        id: `sync-${Date.now()}`,
        supplierName: 'ResellHat',
        mode: 'sync',
        totalProcessed,
        createdCount: 0,
        updatedCount,
        skippedCount,
        failedCount: errors.length,
        errors: errors.slice(0, 25),
        triggeredBy: currentUser?.email || 'admin',
        createdAt: nowIso,
      });

      await saveSupplierIntegration({
        ...savedConfig,
        status: 'connected',
        lastSyncedAt: nowIso,
        importedCount: importedBySupplierId.size,
      });

      setBulkProgressPct(100);
      showToast(`Synchronized ${updatedCount} product(s) with ResellHat`);
    } catch (err: any) {
      showToast(err?.message || 'Synchronization failed.');
    } finally {
      setBulkJobActive(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (savedConfig.status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E9EFEA] text-[#1B3B2B] text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
        </span>
      );
    }
    if (savedConfig.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> Connection Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5" /> Not Verified / Unconfigured
      </span>
    );
  }, [savedConfig.status]);

  const sampleCost = 500;
  const sampleSelling = calculateSellingPrice(
    sampleCost,
    markupType === 'custom' ? 'percentage' : markupType,
    markupValue
  );
  const sampleProfit = calculateProfitSummary(sampleCost, sampleSelling);

  return (
    <div className="space-y-6">
      {/* Header & Connection Status Card */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E9EFEA] text-[#1B3B2B] flex items-center justify-center">
                <PlugZap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#171C19]">
                  ResellHat Supplier Integration
                </h2>
                <p className="text-xs text-[#5C655F]">
                  Read-only catalog proxy via Cloudflare Pages Function · Endpoint:{' '}
                  <span className="font-mono">resellhat.com/api/v1/products</span>
                </p>
              </div>
              {statusBadge}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSetupGuide((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium text-[#171C19] hover:bg-[#F3F0E8] inline-flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#1B3B2B]" />
              <span>{showSetupGuide ? 'Hide Security Setup' : 'API Secret Setup'}</span>
            </button>

            <button
              type="button"
              disabled={testingConn}
              onClick={handleTestConnection}
              className="px-4 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-semibold text-[#171C19] hover:bg-[#E9EFEA] inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
              <span>{testingConn ? 'Testing...' : 'Test API Connection'}</span>
            </button>

            <button
              type="button"
              disabled={bulkJobActive || importedCount === 0}
              onClick={() => setSyncModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Imported ({importedCount})</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E4E0D6]">
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
            <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
              Imported ResellHat Products
            </p>
            <p className="font-mono text-xl font-semibold text-[#171C19] mt-1 tabular-nums">
              {importedCount}
            </p>
            <p className="text-[11px] text-[#5C655F] mt-0.5">
              Deduplicated by Supplier Product ID
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
            <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
              Last Successful Sync
            </p>
            <p className="text-sm font-semibold text-[#171C19] mt-1.5">
              {savedConfig.lastSyncedAt
                ? new Date(savedConfig.lastSyncedAt).toLocaleString()
                : 'No sync recorded yet'}
            </p>
            <p className="text-[11px] text-[#5C655F] mt-0.5">
              {savedConfig.lastTestedAt
                ? `Last tested: ${new Date(savedConfig.lastTestedAt).toLocaleString()}`
                : 'Click Test API Connection to verify'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]">
            <p className="text-[11px] uppercase tracking-wider text-[#5C655F] font-semibold">
              Credential Protection
            </p>
            <p className="text-sm font-semibold text-[#1B3B2B] mt-1.5 inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Server-Side Secret Only</span>
            </p>
            <p className="text-[11px] text-[#5C655F] mt-0.5">
              Bearer token never enters browser JS or Firestore
            </p>
          </div>
        </div>

        {/* Feedback Banner */}
        {(testFeedback || savedConfig.lastError) && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testFeedback?.ok
                ? 'bg-[#E9EFEA] border-[#6E8774]/40 text-[#1B3B2B]'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {testFeedback?.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {testFeedback?.ok ? 'API Connection Verified' : 'Connection Attention Needed'}
              </p>
              <p className="mt-0.5">{testFeedback?.message || savedConfig.lastError}</p>
            </div>
          </div>
        )}

        {/* Secure Server-Side Credential Configuration Guide */}
        {showSetupGuide && (
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-2.5 text-xs text-[#171C19]">
            <p className="font-semibold text-sm text-[#1B3B2B]">
              How to Configure Your ResellHat API Key Securely
            </p>
            <p className="text-[#5C655F] leading-relaxed">
              For security, VEYRA never stores your ResellHat API key in browser code, frontend{' '}
              <span className="font-mono">VITE_*</span> variables, or Cloud Firestore documents. All
              ResellHat API requests go through Cloudflare Pages Functions at{' '}
              <span className="font-mono">/functions/api/suppliers/resellhat/*</span> using your
              verified Firebase admin session.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[#171C19]">
              <li>
                Open <strong>Cloudflare Dashboard → Workers &amp; Pages → Your VEYRA Project</strong>.
              </li>
              <li>
                Go to <strong>Settings → Variables and Secrets</strong>.
              </li>
              <li>
                Add a secret named <span className="font-mono font-semibold">RESELLHAT_API_KEY</span>{' '}
                (Production &amp; Preview) containing your ResellHat Bearer token.
              </li>
              <li>
                Redeploy Cloudflare Pages (or set{' '}
                <span className="font-mono">RESELLHAT_API_KEY</span> in your server{' '}
                <span className="font-mono">.env</span> locally), then click{' '}
                <strong>Test API Connection</strong> above.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Profit Margin & Default Import Rules */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1B3B2B]" />
            <h3 className="font-serif text-xl font-semibold text-[#171C19]">
              Profit Margin &amp; Import Rules
            </h3>
          </div>
          <button
            type="button"
            disabled={savingConfig}
            onClick={handleSaveDefaults}
            className="px-4 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold text-[#171C19] hover:bg-[#E9EFEA] disabled:opacity-60"
          >
            {savingConfig ? 'Saving...' : 'Save Default Rules'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Pricing Formula
            </label>
            <select
              value={markupType}
              onChange={(e) => setMarkupType(e.target.value as SupplierMarkupType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
            >
              <option value="percentage">Percentage Markup (+%)</option>
              <option value="fixed">Fixed Markup (+৳)</option>
              <option value="custom">Custom Price (Review Each)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              {markupType === 'fixed' ? 'Fixed Markup Amount (৳)' : 'Markup Percentage (%)'}
            </label>
            <input
              type="number"
              min={0}
              disabled={markupType === 'custom'}
              value={markupValue}
              onChange={(e) => setMarkupValue(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Fallback VEYRA Category
            </label>
            <select
              value={defaultCategoryId}
              onChange={(e) => setDefaultCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C655F] mb-1">
              Default Import Visibility
            </label>
            <select
              value={defaultPublishStatus}
              onChange={(e) => setDefaultPublishStatus(e.target.value as 'draft' | 'published')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-medium"
            >
              <option value="draft">Save as Draft (Recommended)</option>
              <option value="published">Publish Immediately</option>
            </select>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[#171C19]">
            <span className="font-semibold">Live Margin Preview:</span> Supplier cost{' '}
            <span className="font-mono font-semibold">{formatBDT(sampleCost)}</span> → Selling price{' '}
            <span className="font-mono font-semibold text-[#1B3B2B]">
              {formatBDT(sampleSelling)}
            </span>{' '}
            · Est. gross profit{' '}
            <span className="font-mono font-semibold text-[#1B3B2B]">
              +{formatBDT(sampleProfit.profitAmount)} ({sampleProfit.markupPct}%)
            </span>
          </div>
          <span className="text-[11px] text-[#5C655F] inline-flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Supplier price excludes domestic delivery charges.
          </span>
        </div>
      </div>

      {/* Bulk Job Progress Indicator */}
      {bulkJobActive && (
        <div className="bg-white border border-[#1B3B2B]/40 rounded-2xl p-5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1B3B2B] inline-flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {bulkJobTitle}
            </span>
            <span className="font-mono text-[#5C655F]">{bulkProgressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F3F0E8] overflow-hidden">
            <div
              className="h-full bg-[#1B3B2B] transition-all duration-300"
              style={{ width: `${bulkProgressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#5C655F]">{bulkProgressText}</p>
        </div>
      )}

      {/* Browse & Import ResellHat Catalog */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#171C19]">
              Browse ResellHat Catalog
            </h3>
            <p className="text-xs text-[#5C655F] mt-0.5">
              Search, filter by supplier category, review product details &amp; pricing, or bulk import with pagination up to 500 items/page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkJobActive}
              onClick={() => {
                setCategoryImportTarget(selectedSupplierCategory);
                setCategoryImportPublish(defaultPublishStatus);
                setIsCategoryImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold text-[#171C19] hover:bg-[#E9EFEA] inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import by Category</span>
            </button>

            <button
              type="button"
              disabled={loadingCatalog}
              onClick={() => loadSupplierPage(1)}
              className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin' : ''}`} />
              <span>{catalogItems.length > 0 ? 'Reload Catalog' : 'Load ResellHat Products'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#5C655F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search loaded products by name, ID, SKU, or category..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedSupplierCategory}
              onChange={(e) => {
                const nextCat = e.target.value;
                setSelectedSupplierCategory(nextCat);
                if (catalogItems.length > 0 || savedConfig.status === 'connected') {
                  loadSupplierPage(1, nextCat, perPage);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
            >
              <option value="all">All ResellHat Categories</option>
              {discoveredCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={perPage}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                setPerPage(nextSize);
                if (catalogItems.length > 0) {
                  loadSupplierPage(1, selectedSupplierCategory, nextSize);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-mono"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={250}>250 / page</option>
              <option value={500}>500 / page (max)</option>
            </select>
          </div>
        </div>

        {/* Catalog Error */}
        {catalogError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load supplier catalog</p>
              <p className="mt-0.5">{catalogError}</p>
            </div>
          </div>
        )}

        {/* Selection Toolbar */}
        {filteredCatalog.length > 0 && (
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#171C19] cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredCatalog.length > 0 &&
                  filteredCatalog.every((item) => selectedIds.includes(item.supplierProductId))
                }
                onChange={() => {
                  const visibleIds = filteredCatalog.map((i) => i.supplierProductId);
                  const allSelected = visibleIds.every((id) => selectedIds.includes(id));
                  if (allSelected) {
                    setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                  } else {
                    setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
                  }
                }}
              />
              <span>
                Select All Shown ({filteredCatalog.length} of {pageMeta.total} total)
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white text-xs text-[#5C655F]"
                >
                  Clear ({selectedIds.length})
                </button>
                <button
                  type="button"
                  disabled={bulkJobActive}
                  onClick={handleImportSelectedOnPage}
                  className="px-4 py-1.5 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] inline-flex items-center gap-1.5"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>
                    {selectedIds.length === 1
                      ? 'Review & Import Selected'
                      : `Import Selected (${selectedIds.length})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Supplier Product List */}
        {catalogItems.length === 0 && !loadingCatalog ? (
          <div className="py-12 px-4 text-center border border-dashed border-[#E4E0D6] rounded-2xl space-y-2">
            <p className="text-sm font-medium text-[#171C19]">
              No ResellHat products loaded yet
            </p>
            <p className="text-xs text-[#5C655F] max-w-md mx-auto">
              Ensure <span className="font-mono">RESELLHAT_API_KEY</span> is configured in your server
              environment secrets, then click <strong>Load ResellHat Products</strong> above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D6] border border-[#E4E0D6] rounded-2xl overflow-hidden">
            {filteredCatalog.map((item) => {
              const existing = importedBySupplierId.get(item.supplierProductId);
              const isSelected = selectedIds.includes(item.supplierProductId);
              const effMarkupType = markupType === 'custom' ? 'percentage' : markupType;
              const estSelling = existing
                ? existing.price
                : calculateSellingPrice(item.supplierPrice, effMarkupType, markupValue);
              const profit = calculateProfitSummary(item.supplierPrice, estSelling);

              return (
                <div
                  key={item.supplierProductId}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-[#E9EFEA]/40' : 'bg-white hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(item.supplierProductId)
                            ? prev.filter((id) => id !== item.supplierProductId)
                            : [...prev, item.supplierProductId]
                        )
                      }
                      className="mt-1.5 shrink-0"
                    />
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#E4E0D6] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] flex items-center justify-center text-[10px] text-[#5C655F] shrink-0">
                        No Image
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm text-[#171C19] truncate">
                          {item.name}
                        </p>
                        {existing && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              existing.isActive
                                ? 'bg-[#E9EFEA] text-[#1B3B2B]'
                                : 'bg-amber-50 border border-amber-200 text-amber-900'
                            }`}
                          >
                            {existing.isActive ? 'Imported · Live' : 'Imported · Draft'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5C655F] font-mono">
                        ID: {item.supplierProductId} · SKU: {item.sku} · {item.category} ·{' '}
                        {item.availability}
                      </p>
                      <p className="text-xs text-[#5C655F] line-clamp-1">
                        {item.shortDescription || item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right text-xs space-y-0.5">
                      <p className="text-[#5C655F]">
                        Supplier:{' '}
                        <span className="font-mono font-semibold text-[#171C19]">
                          {formatBDT(item.supplierPrice)}
                        </span>
                      </p>
                      <p className="text-[#1B3B2B]">
                        Selling:{' '}
                        <span className="font-mono font-semibold">{formatBDT(estSelling)}</span>
                      </p>
                      <p className="text-[11px] font-mono text-[#6E8774]">
                        Profit: +{formatBDT(profit.profitAmount)} ({profit.markupPct}%)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReviewModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs font-semibold text-[#171C19] hover:bg-[#1B3B2B] hover:text-[#FAF8F4] transition-colors inline-flex items-center gap-1.5"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>{existing ? 'Review / Update' : 'Review & Import'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pageMeta.last_page > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-[#5C655F] font-mono">
              Page {pageMeta.current_page} of {pageMeta.last_page} ({pageMeta.total} total products)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loadingCatalog || pageMeta.current_page <= 1}
                onClick={() => loadSupplierPage(pageMeta.current_page - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#FAF8F4] disabled:opacity-40 inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={loadingCatalog || pageMeta.current_page >= pageMeta.last_page}
                onClick={() => loadSupplierPage(pageMeta.current_page + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#FAF8F4] disabled:opacity-40 inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import History */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold text-[#171C19] inline-flex items-center gap-2">
            <History className="w-4 h-4 text-[#1B3B2B]" />
            <span>Supplier Import &amp; Sync History ({supplierImportLogs.length})</span>
          </h3>
        </div>

        {supplierImportLogs.length === 0 ? (
          <p className="text-xs text-[#5C655F] py-4">
            No supplier imports or sync runs logged yet.
          </p>
        ) : (
          <div className="divide-y divide-[#E4E0D6] border border-[#E4E0D6] rounded-xl overflow-hidden">
            {supplierImportLogs.map((log) => (
              <div key={log.id} className="p-3.5 text-xs space-y-2 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#171C19] capitalize">
                        {log.supplierName} ·{' '}
                        {log.mode === 'category'
                          ? `Category Bulk (${log.categoryFilter || 'All'})`
                          : log.mode === 'sync'
                          ? 'Manual Sync'
                          : 'Selected Import'}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#E9EFEA] text-[#1B3B2B]">
                        +{log.createdCount} new · {log.updatedCount} updated · {log.skippedCount}{' '}
                        skipped
                      </span>
                      {log.failedCount > 0 && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700">
                          {log.failedCount} failed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C655F] inline-flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()} · by {log.triggeredBy}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.errors?.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLogId((prev) => (prev === log.id ? null : log.id))
                        }
                        className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px]"
                      >
                        {expandedLogId === log.id ? 'Hide Errors' : 'View Errors'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteSupplierImportLog(log.id)}
                      className="p-1.5 rounded-lg border border-[#E4E0D6] text-[#5C655F] hover:text-red-700"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedLogId === log.id && log.errors?.length > 0 && (
                  <ul className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800 space-y-1 list-disc list-inside">
                    {log.errors.map((errMsg, idx) => (
                      <li key={idx}>{errMsg}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-[#5C655F] pt-1">
          Scope notice: ResellHat integration supports product catalog browsing, pricing, importing,
          and manual synchronization via <span className="font-mono">GET /api/v1/products</span>.
          Orders and checkout continue to be managed directly within VEYRA.
        </p>
      </div>

      {/* Product Customization & Review Import Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveReviewedProduct}
            className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E4E0D6]">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#6E8774] font-semibold">
                  ResellHat ID #{reviewItem.supplierProductId} · Supplier Cost{' '}
                  {formatBDT(reviewItem.supplierPrice)}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#171C19]">
                  Customize &amp; Import Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewItem(null)}
                className="p-1.5 rounded-lg text-[#5C655F] hover:text-[#171C19]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  VEYRA Product Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C655F] mb-1">
                  VEYRA Category *
                </label>
                <select
                  value={reviewCategoryId}
                  onChange={(e) => setReviewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Short Summary (max 320 chars)
              </label>
              <input
                type="text"
                maxLength={320}
                value={reviewShortDesc}
                onChange={(e) => setReviewShortDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C655F] mb-1">
                Full Product Description *
              </label>
              <textarea
                rows={4}
                required
                maxLength={4000}
                value={reviewDesc}
                onChange={(e) => setReviewDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
              />
            </div>

            {/* Pricing & Profit Calculation */}
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5C655F] mb-1">
                    Pricing Mode
                  </label>
                  <select
                    value={reviewMarkupType}
                    onChange={(e) => setReviewMarkupType(e.target.value as SupplierMarkupType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs"
                  >
                    <option value="percentage">Percentage Markup (+%)</option>
                    <option value="fixed">Fixed Markup (+৳)</option>
                    <option value="custom">Custom Selling Price</option>
                  </select>
                </div>

                {reviewMarkupType === 'custom' ? (
                  <div>
                    <label className="block text-xs font-medium text-[#5C655F] mb-1">
                      Selling Price (৳ BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={reviewCustomPrice}
                      onChange={(e) => setReviewCustomPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#5C655F] mb-1">
                      {reviewMarkupType === 'fixed' ? 'Fixed Markup (+৳)' : 'Markup (%)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={reviewMarkupVal}
                      onChange={(e) => setReviewMarkupVal(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E4E0D6] text-xs font-mono"
                    />
                  </div>
                )}

                <div className="flex flex-col justify-center">
                  <p className="text-[11px] text-[#5C655F]">Calculated Selling Price</p>
                  <p className="font-mono text-lg font-semibold text-[#1B3B2B]">
                    {formatBDT(reviewComputedPrice)}
                  </p>
                </div>
              </div>

              {(() => {
                const pSum = calculateProfitSummary(reviewItem.supplierPrice, reviewComputedPrice);
                return (
                  <p className="text-[11px] text-[#5C655F]">
                    Estimated gross profit:{' '}
                    <strong className="text-[#1B3B2B] font-mono">
                      +{formatBDT(pSum.profitAmount)} ({pSum.markupPct}% markup / {pSum.marginPct}%
                      margin)
                    </strong>{' '}
                    · Note: supplier cost excludes delivery charges.
                  </p>
                );
              })()}
            </div>

            {/* Product Images Review */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#5C655F]">
                Product Images ({reviewImages.length}/12)
              </label>
              <div className="flex flex-wrap gap-2">
                {reviewImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E4E0D6] group"
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setReviewImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={reviewNewImageUrl}
                  onChange={(e) => setReviewNewImageUrl(e.target.value)}
                  placeholder="Add HTTPS image URL..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = reviewNewImageUrl.trim();
                    if (clean && (clean.startsWith('http://') || clean.startsWith('https://'))) {
                      setReviewImages((prev) =>
                        prev.includes(clean) ? prev : [...prev, clean].slice(0, 12)
                      );
                      setReviewNewImageUrl('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#F3F0E8] border border-[#E4E0D6] text-xs font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Visibility & Featured Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E4E0D6]">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#171C19]">
                  <input
                    type="checkbox"
                    checked={reviewFeatured}
                    onChange={(e) => setReviewFeatured(e.target.checked)}
                  />
                  <Star className="w-3.5 h-3.5 text-amber-600" />
                  <span>Featured Product</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#171C19]">
                  <input
                    type="checkbox"
                    checked={reviewPublish}
                    onChange={(e) => setReviewPublish(e.target.checked)}
                  />
                  <span>{reviewPublish ? 'Publish Immediately (Live)' : 'Save as Draft (Hidden)'}</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#E4E0D6] text-xs font-medium text-[#171C19]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSingle}
                  className="px-5 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20] disabled:opacity-60"
                >
                  {savingSingle
                    ? 'Saving...'
                    : reviewPublish
                    ? 'Publish to VEYRA'
                    : 'Save as Draft'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Category Import Modal */}
      {isCategoryImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRunCategoryBulkImport}
            className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                Bulk Import by Category
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryImportModalOpen(false)}
                className="p-1 text-[#5C655F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#5C655F] mb-1">
                  ResellHat Category
                </label>
                <input
                  type="text"
                  value={categoryImportTarget}
                  onChange={(e) => setCategoryImportTarget(e.target.value)}
                  placeholder="all or exact category slug/name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]"
                />
                {discoveredCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setCategoryImportTarget('all')}
                      className={`px-2 py-0.5 rounded border text-[11px] ${
                        categoryImportTarget === 'all'
                          ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                          : 'bg-[#FAF8F4] border-[#E4E0D6]'
                      }`}
                    >
                      all
                    </button>
                    {discoveredCategories.slice(0, 12).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryImportTarget(cat)}
                        className={`px-2 py-0.5 rounded border text-[11px] ${
                          categoryImportTarget === cat
                            ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                            : 'bg-[#FAF8F4] border-[#E4E0D6]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#5C655F] mb-1">
                  New Product Status
                </label>
                <select
                  value={categoryImportPublish}
                  onChange={(e) =>
                    setCategoryImportPublish(e.target.value as 'draft' | 'published')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6]"
                >
                  <option value="draft">Save Newly Imported as Draft (Recommended)</option>
                  <option value="published">Publish Immediately</option>
                </select>
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={categoryImportOverwrite}
                  onChange={(e) => setCategoryImportOverwrite(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[#5C655F]">
                  Update already-imported matching items instead of skipping them (recommended off
                  to preserve customized titles &amp; prices).
                </span>
              </label>

              <p className="text-[11px] text-[#5C655F] bg-[#FAF8F4] p-3 rounded-xl border border-[#E4E0D6]">
                Paginates safely across <span className="font-mono">meta.last_page</span> with{' '}
                <span className="font-mono">per_page=500</span> and saves to Firestore in batches.
                Pricing uses your saved rule (
                <span className="font-mono">
                  {markupType === 'fixed' ? `+৳${markupValue}` : `+${markupValue}%`}
                </span>
                ).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCategoryImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E4E0D6] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20]"
              >
                Start Paginated Import
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Sync Options Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRunManualSync}
            className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
              <h3 className="font-serif text-xl font-semibold text-[#171C19]">
                Sync {importedCount} ResellHat Product(s)
              </h3>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="p-1 text-[#5C655F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C655F] leading-relaxed">
              Synchronization checks live ResellHat data and updates{' '}
              <strong>supplier price</strong>, <strong>stock</strong>, and{' '}
              <strong>last synced timestamp</strong> without creating duplicate products. Your
              custom VEYRA titles, descriptions, categories, and images are always preserved.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF8F4] border border-[#E4E0D6] text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={syncRecalculatePrices}
                onChange={(e) => setSyncRecalculatePrices(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[#171C19]">
                <strong>Also recalculate VEYRA selling prices</strong> from updated supplier costs
                using each product&apos;s saved markup rule (products set to Custom Price remain
                unchanged).
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E4E0D6] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1B3B2B] text-[#FAF8F4] text-xs font-semibold hover:bg-[#142D20]"
              >
                Run Synchronization
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
