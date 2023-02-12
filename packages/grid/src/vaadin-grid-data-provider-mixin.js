/**
 * @license
 * Copyright (c) 2016 - 2023 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { timeOut } from '@vaadin/component-base/src/async.js';
import { DataProviderController } from '@vaadin/component-base/src/data-provider-controller.js';
import { Debouncer } from '@vaadin/component-base/src/debounce.js';
import { get } from '@vaadin/component-base/src/path-utils.js';
import { getBodyRowCells, updateCellsPart, updateState } from './vaadin-grid-helpers.js';

/**
 * @polymerMixin
 */
export const DataProviderMixin = (superClass) =>
  class DataProviderMixin extends superClass {
    static get properties() {
      return {
        /**
         * The number of root-level items in the grid.
         * @attr {number} size
         * @type {number}
         */
        size: {
          type: Number,
          notify: true,
          observer: '_sizeChanged',
        },

        /**
         * Number of items fetched at a time from the dataprovider.
         * @attr {number} page-size
         * @type {number}
         */
        pageSize: {
          type: Number,
          value: 50,
          observer: '_pageSizeChanged',
        },

        /**
         * Function that provides items lazily. Receives arguments `params`, `callback`
         *
         * `params.page` Requested page index
         *
         * `params.pageSize` Current page size
         *
         * `params.filters` Currently applied filters
         *
         * `params.sortOrders` Currently applied sorting orders
         *
         * `params.parentItem` When tree is used, and sublevel items
         * are requested, reference to parent item of the requested sublevel.
         * Otherwise `undefined`.
         *
         * `callback(items, size)` Callback function with arguments:
         *   - `items` Current page of items
         *   - `size` Total number of items. When tree sublevel items
         *     are requested, total number of items in the requested sublevel.
         *     Optional when tree is not used, required for tree.
         *
         * @type {GridDataProvider | null | undefined}
         */
        dataProvider: {
          type: Object,
          notify: true,
          observer: '_dataProviderChanged',
        },

        /**
         * `true` while data is being requested from the data provider.
         */
        loading: {
          type: Boolean,
          notify: true,
          readOnly: true,
          reflectToAttribute: true,
        },

        /**
         * @protected
         */
        _hasData: {
          type: Boolean,
          value: false,
        },

        /**
         * Path to an item sub-property that indicates whether the item has child items.
         * @attr {string} item-has-children-path
         */
        itemHasChildrenPath: {
          type: String,
          value: 'children',
          observer: '__itemHasChildrenPathChanged',
        },

        /**
         * Path to an item sub-property that identifies the item.
         * @attr {string} item-id-path
         */
        itemIdPath: {
          type: String,
          value: null,
        },

        /**
         * An array that contains the expanded items.
         * @type {!Array<!GridItem>}
         */
        expandedItems: {
          type: Object,
          notify: true,
          value: () => [],
        },

        /**
         * @private
         */
        __expandedKeys: {
          type: Object,
          observer: '__expandedKeysChanged',
          computed: '__computeExpandedKeys(itemIdPath, expandedItems.*)',
        },
      };
    }

    constructor() {
      super();

      /** @type {DataProviderController} */
      this._dataProviderController = new DataProviderController(this, {
        size: this.size,
        pageSize: this.pageSize,
        isExpanded: this._isExpanded.bind(this),
        dataProvider: this.dataProvider ? this.dataProvider.bind(this) : null,
        dataProviderParams: () => {
          return {
            sortOrders: this._mapSorters(),
            filters: this._mapFilters(),
          };
        },
      });

      this._dataProviderController.addEventListener('page-requested', this._onDataProviderPageRequested.bind(this));
      this._dataProviderController.addEventListener('page-received', this._onDataProviderPageReceived.bind(this));
      this._dataProviderController.addEventListener('page-loaded', this._onDataProviderPageLoaded.bind(this));
    }

    /** @private */
    _sizeChanged(size) {
      this._dataProviderController.setSize(size);
      this._effectiveSize = this._dataProviderController.effectiveSize;
    }

    /** @private */
    __itemHasChildrenPathChanged(value, oldValue) {
      if (!oldValue && value === 'children') {
        // Avoid an unnecessary content update on init.
        return;
      }
      this.requestContentUpdate();
    }

    /**
     * @param {number} index
     * @param {HTMLElement} el
     * @protected
     */
    _getItem(index, el) {
      if (index >= this._effectiveSize) {
        return;
      }

      el.index = index;

      const { item } = this._dataProviderController.getFlatIndexInfo(index);
      if (item) {
        this.__updateLoading(el, false);
        this._updateItem(el, item);
        if (this._isExpanded(item)) {
          this._dataProviderController.ensureFlatIndexChildrenLoaded(index);
        }
      } else {
        this.__updateLoading(el, true);
        this._dataProviderController.ensureFlatIndexLoaded(index);
      }
    }

    /**
     * @param {!HTMLElement} row
     * @param {boolean} loading
     * @private
     */
    __updateLoading(row, loading) {
      const cells = getBodyRowCells(row);

      // Row state attribute
      updateState(row, 'loading', loading);

      // Cells part attribute
      updateCellsPart(cells, 'loading-row-cell', loading);
    }

    /**
     * Returns a value that identifies the item. Uses `itemIdPath` if available.
     * Can be customized by overriding.
     * @param {!GridItem} item
     * @return {!GridItem | !unknown}
     */
    getItemId(item) {
      return this.itemIdPath ? get(this.itemIdPath, item) : item;
    }

    /**
     * @param {!GridItem} item
     * @return {boolean}
     * @protected
     */
    _isExpanded(item) {
      return this.__expandedKeys.has(this.getItemId(item));
    }

    /** @private */
    __expandedKeysChanged() {
      this._dataProviderController.recalculateEffectiveSize();
      this._effectiveSize = this._dataProviderController.effectiveSize;
      this.__updateVisibleRows();
    }

    /** @private */
    __computeExpandedKeys(itemIdPath, expandedItems) {
      const expanded = expandedItems.base || [];
      const expandedKeys = new Set();
      expanded.forEach((item) => {
        expandedKeys.add(this.getItemId(item));
      });

      return expandedKeys;
    }

    /**
     * Expands the given item tree.
     * @param {!GridItem} item
     */
    expandItem(item) {
      if (!this._isExpanded(item)) {
        this.expandedItems = [...this.expandedItems, item];
      }
    }

    /**
     * Collapses the given item tree.
     * @param {!GridItem} item
     */
    collapseItem(item) {
      if (this._isExpanded(item)) {
        this.expandedItems = this.expandedItems.filter((i) => !this._itemsEqual(i, item));
      }
    }

    /**
     * @param {number} index
     * @return {number}
     * @protected
     */
    _getIndexLevel(index = 0) {
      const { level } = this._dataProviderController.getFlatIndexInfo(index);
      return level;
    }

    /** @protected */
    _onDataProviderPageRequested() {
      this._setLoading(true);
    }

    /** @protected */
    _onDataProviderPageReceived() {
      // With the new items added, update the cache size and the grid's effective size
      this._effectiveSize = this._dataProviderController.effectiveSize;

      // After updating the cache, check if some of the expanded items should have sub-caches loaded
      this._getRenderedRows().forEach((row) => {
        this._dataProviderController.ensureFlatIndexChildrenLoaded(row.index);
      });

      this._hasData = true;
    }

    /** @protected */
    _onDataProviderPageLoaded() {
      // Schedule a debouncer to update the visible rows
      this._debouncerApplyCachedData = Debouncer.debounce(this._debouncerApplyCachedData, timeOut.after(0), () => {
        this._setLoading(false);

        this._getRenderedRows().forEach((row) => {
          const { item } = this._dataProviderController.getFlatIndexInfo(row.index);
          if (item) {
            this._getItem(row.index, row);
          }
        });

        this.__scrollToPendingIndexes();
      });

      // If the grid is not loading anything, flush the debouncer immediately
      if (!this._dataProviderController.isLoading) {
        this._debouncerApplyCachedData.flush();
      }
    }

    /**
     * Clears the cached pages and reloads data from dataprovider when needed.
     */
    clearCache() {
      this._dataProviderController.clearCache();
      this._hasData = false;
      this.__updateVisibleRows();
      this._ensureFirstPageLoaded();
    }

    /** @private */
    _pageSizeChanged(pageSize, oldPageSize) {
      if (oldPageSize !== undefined && pageSize !== oldPageSize) {
        this._dataProviderController.setPageSize(pageSize);
        this._hasData = false;
        this.__updateVisibleRows();
        this._ensureFirstPageLoaded();
      }
    }

    /** @protected */
    _checkSize() {
      if (this.size === undefined && this._effectiveSize === 0) {
        console.warn(
          'The <vaadin-grid> needs the total number of items in' +
            ' order to display rows, which you can specify either by setting' +
            ' the `size` property, or by providing it to the second argument' +
            ' of the `dataProvider` function `callback` call.',
        );
      }
    }

    /** @private */
    _dataProviderChanged(dataProvider, oldDataProvider) {
      this._dataProviderController.setDataProvider(dataProvider ? dataProvider.bind(this) : null);

      if (oldDataProvider !== undefined) {
        this._hasData = false;
        this.__updateVisibleRows();
      }

      this._ensureFirstPageLoaded();

      this._debouncerCheckSize = Debouncer.debounce(
        this._debouncerCheckSize,
        timeOut.after(2000),
        this._checkSize.bind(this),
      );
    }

    /** @protected */
    _ensureFirstPageLoaded() {
      if (!this._hasData) {
        // Load data before adding rows to make sure they have content when
        // rendered for the first time.
        this._dataProviderController.ensureFirstPageLoaded();
      }
    }

    /**
     * @param {!GridItem} item1
     * @param {!GridItem} item2
     * @return {boolean}
     * @protected
     */
    _itemsEqual(item1, item2) {
      return this.getItemId(item1) === this.getItemId(item2);
    }

    /**
     * @param {!GridItem} item
     * @param {!Array<!GridItem>} array
     * @return {number}
     * @protected
     */
    _getItemIndexInArray(item, array) {
      let result = -1;
      array.forEach((i, idx) => {
        if (this._itemsEqual(i, item)) {
          result = idx;
        }
      });
      return result;
    }

    /**
     * Scroll to a specific row index in the virtual list. Note that the row index is
     * not always the same for any particular item. For example, sorting or filtering
     * items can affect the row index related to an item.
     *
     * The `indexes` parameter can be either a single number or multiple numbers.
     * The grid will first try to scroll to the item at the first index on the top level.
     * In case the item at the first index is expanded, the grid will then try scroll to the
     * item at the second index within the children of the expanded first item, and so on.
     * Each given index points to a child of the item at the previous index.
     *
     * Using `Infinity` as an index will point to the last item on the level.
     *
     * @param indexes {...number} Row indexes to scroll to
     */
    scrollToIndex(...indexes) {
      // Synchronous data provider may cause changes to the cache on scroll without
      // ending up in a loading state. Try scrolling to the index until the target
      // index stabilizes.
      let targetIndex;
      while (targetIndex !== (targetIndex = this._dataProviderController.getFlatIndexByPath(indexes))) {
        this._scrollToFlatIndex(targetIndex);
      }

      if (this._dataProviderController.isLoading || !this.clientHeight) {
        this.__pendingScrollToIndexes = indexes;
      }
    }

    /** @private */
    __scrollToPendingIndexes() {
      if (this.__pendingScrollToIndexes && this.$.items.children.length) {
        const indexes = this.__pendingScrollToIndexes;
        delete this.__pendingScrollToIndexes;
        this.scrollToIndex(...indexes);
      }
    }

    /**
     * Fired when the `expandedItems` property changes.
     *
     * @event expanded-items-changed
     */

    /**
     * Fired when the `loading` property changes.
     *
     * @event loading-changed
     */
  };
