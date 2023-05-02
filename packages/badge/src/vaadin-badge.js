/**
 * @license
 * Copyright (c) 2022 - 2023 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { ElementMixin } from '@vaadin/component-base/src/element-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';

/**
 * `<vaadin-badge>` is a Web Component for showing information in the form of colored badges.
 *
 * ```
 *  <vaadin-badge>Success</vaadin-badge>
 * ```
 *
 * ### Styling
 *
 * No shadow DOM parts are exposed for styling.
 *
 * The following `theme` variants are supported: small, success, error, contrast, primary, pill
 *
 * See [Styling Components](hhttps://vaadin.com/docs/latest/components/ds-resources/customization/styling-components) documentation.
 *
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 */
class Badge extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          text-transform: initial;
          letter-spacing: initial;
          white-space: nowrap;
          line-height: 1;
        }

        /* Links */
        ::slotted([href]:any-link) {
          text-decoration: none;
        }

        /* Ensure proper vertical alignment when an icon is used inside a badge */
        :host::before {
          display: inline-block;
          content: '\\2003';
          width: 0;
        }
      </style>
      <slot></slot>
    `;
  }

  static get is() {
    return 'vaadin-badge';
  }

  constructor() {
    super();
    if (!window?.Vaadin?.featureFlags?.badgeComponent) {
      throw new Error(
        `${Badge.is} can only be used when the feature flag window.Vaadin.featureFlags.badgeComponent===true`,
      );
    }
  }
}

customElements.define(Badge.is, Badge);

export { Badge };
