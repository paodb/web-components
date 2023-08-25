import { Cache } from './cache.js';
import { getFlatIndexByPath, getFlatIndexInfo } from './helpers.js';

export class DataProviderController extends EventTarget {
  constructor(host, { size, pageSize, isExpanded, dataProvider, dataProviderParams }) {
    super();
    this.host = host;
    this.size = size;
    this.pageSize = pageSize;
    this.isExpanded = isExpanded;
    this.dataProvider = dataProvider;
    this.dataProviderParams = dataProviderParams;
    this.rootCache = this.#createRootCache();
  }

  get effectiveSize() {
    return this.rootCache.effectiveSize;
  }

  get #cacheContext() {
    return { isExpanded: this.isExpanded };
  }

  isLoading() {
    return this.rootCache.isLoading;
  }

  setSize(size) {
    const delta = size - this.rootCache.size;
    this.size = size;
    this.rootCache.size += delta;
    this.rootCache.effectiveSize += delta;
  }

  setPageSize(pageSize) {
    this.pageSize = pageSize;
    this.clearCache();
  }

  setDataProvider(dataProvider) {
    this.dataProvider = dataProvider;
    this.clearCache();
  }

  recalculateEffectiveSize() {
    this.rootCache.recalculateEffectiveSize();
  }

  clearCache() {
    this.rootCache = this.#createRootCache();
  }

  getFlatIndexInfo(flatIndex) {
    return getFlatIndexInfo(this.rootCache, flatIndex);
  }

  getFlatIndexByPath(path) {
    return getFlatIndexByPath(this.rootCache, path);
  }

  ensureFlatIndexLoaded(flatIndex) {
    const { cache, page, item } = this.getFlatIndexInfo(flatIndex);

    if (!item) {
      this.#loadCachePage(cache, page);
    }
  }

  ensureFlatIndexHierarchy(flatIndex) {
    const { cache, item, index } = this.getFlatIndexInfo(flatIndex);

    if (item && this.isExpanded(item) && !cache.getSubCache(index)) {
      const subCache = cache.createSubCache(index);
      this.#loadCachePage(subCache, 0);
    }
  }

  loadFirstPage() {
    this.#loadCachePage(this.rootCache, 0);
  }

  #createRootCache() {
    return new Cache(this.#cacheContext, this.pageSize, this.size);
  }

  #loadCachePage(cache, page) {
    if (!this.dataProvider || cache.pendingRequests.has(page)) {
      return;
    }

    const params = {
      page,
      pageSize: this.pageSize,
      parentItem: cache.parentItem,
      ...this.dataProviderParams(),
    };

    const callback = (items, size) => {
      if (size !== undefined) {
        cache.size = size;
      } else if (params.parentItem) {
        cache.size = items.length;
      }

      cache.setPage(page, items);

      this.recalculateEffectiveSize();

      this.dispatchEvent(new CustomEvent('page-received'));

      cache.pendingRequests.delete(page);

      this.dispatchEvent(new CustomEvent('page-loaded'));
    };

    cache.pendingRequests.set(page, callback);

    this.dispatchEvent(new CustomEvent('page-requested'));

    this.dataProvider(params, callback);
  }
}
