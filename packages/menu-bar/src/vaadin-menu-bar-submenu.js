/**
 * @license
 * Copyright (c) 2019 - 2023 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import './vaadin-menu-bar-item.js';
import './vaadin-menu-bar-list-box.js';
import './vaadin-menu-bar-overlay.js';
import { css, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ContextMenu } from '@vaadin/context-menu/src/vaadin-context-menu.js';

/**
 * An element used internally by `<vaadin-menu-bar>`. Not intended to be used separately.
 *
 * @extends ContextMenu
 * @protected
 */
class MenuBarSubmenu extends ContextMenu {
  static get is() {
    return 'vaadin-menu-bar-submenu';
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none !important;
      }
    `;
  }

  constructor() {
    super();

    this.openOn = 'opensubmenu';
  }

  /**
   * Tag name prefix used by overlay, list-box and items.
   * @protected
   * @return {string}
   */
  get _tagNamePrefix() {
    return 'vaadin-menu-bar';
  }

  /** @protected */
  render() {
    return html`
      <slot id="slot"></slot>

      <vaadin-menu-bar-overlay
        id="overlay"
        .owner="${this}"
        .modeless="${this._modeless}"
        .withBackdrop="${this._phone}"
        ?phone="${this._phone}"
        .model="${this._context}"
        theme="${ifDefined(this._theme)}"
        @opened-changed="${this._onOverlayOpened}"
        @vaadin-overlay-open="${this._onVaadinOverlayOpen}"
      ></vaadin-menu-bar-overlay>
    `;
  }

  /**
   * Overriding the observer to not add global "contextmenu" listener.
   */
  _openedChanged(opened) {
    this.$.overlay.opened = opened;
  }

  /**
   * Overriding the public method to reset expanded button state.
   */
  close() {
    super.close();

    // Only handle 1st level submenu
    if (this.hasAttribute('is-root')) {
      this.getRootNode().host._close();
    }
  }
}

customElements.define(MenuBarSubmenu.is, MenuBarSubmenu);
