/**
 * @license
 * Copyright (c) 2016 - 2023 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import '@vaadin/input-container/src/vaadin-input-container.js';
import './vaadin-date-picker-overlay.js';
import './vaadin-date-picker-overlay-content.js';
import { css, html, LitElement } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { ElementMixin } from '@vaadin/component-base/src/element-mixin.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { TooltipController } from '@vaadin/component-base/src/tooltip-controller.js';
import { InputControlMixin } from '@vaadin/field-base/src/input-control-mixin.js';
import { InputController } from '@vaadin/field-base/src/input-controller.js';
import { LabelledInputController } from '@vaadin/field-base/src/labelled-input-controller.js';
import { inputFieldShared } from '@vaadin/field-base/src/styles/input-field-shared-styles.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import { DatePickerMixin } from './vaadin-date-picker-mixin.js';

/**
 * `<vaadin-date-picker>` is an input field that allows to enter a date by typing or by selecting from a calendar overlay.
 *
 * ```html
 * <vaadin-date-picker label="Birthday"></vaadin-date-picker>
 * ```
 *
 * ```js
 * datePicker.value = '2016-03-02';
 * ```
 *
 * When the selected `value` is changed, a `value-changed` event is triggered.
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property                | Description                | Default
 * -------------------------------|----------------------------|---------
 * `--vaadin-field-default-width` | Default width of the field | `12em`
 *
 * `<vaadin-date-picker>` provides the same set of shadow DOM parts and state attributes as `<vaadin-text-field>`.
 * See [`<vaadin-text-field>`](#/elements/vaadin-text-field) for the styling documentation.
 *
 * In addition to `<vaadin-text-field>` parts, the following parts are available for theming:
 *
 * Part name             | Description
 * ----------------------|--------------------
 * `toggle-button`       | Toggle button
 *
 * In addition to `<vaadin-text-field>` state attributes, the following state attributes are available for theming:
 *
 * Attribute  | Description                                      | Part name
 * -----------|--------------------------------------------------|-----------
 * `opened`   | Set when the date selector overlay is opened     | :host
 *
 * If you want to replace the default `<input>` and its container with a custom implementation to get full control
 * over the input field, consider using the [`<vaadin-date-picker-light>`](#/elements/vaadin-date-picker-light) element.
 *
 * ### Internal components
 *
 * In addition to `<vaadin-date-picker>` itself, the following internal
 * components are themable:
 *
 * - `<vaadin-date-picker-overlay>` - has the same API as [`<vaadin-overlay>`](#/elements/vaadin-overlay).
 * - `<vaadin-date-picker-overlay-content>`
 * - `<vaadin-date-picker-month-scroller>`
 * - `<vaadin-date-picker-year-scroller>`
 * - `<vaadin-date-picker-year>`
 * - `<vaadin-month-calendar>`
 * - [`<vaadin-input-container>`](#/elements/vaadin-input-container) - an internal element wrapping the input.
 *
 * In order to style the overlay content, use `<vaadin-date-picker-overlay-content>` shadow DOM parts:
 *
 * Part name             | Description
 * ----------------------|--------------------
 * `overlay-header`      | Fullscreen mode header
 * `label`               | Fullscreen mode value/label
 * `clear-button`        | Fullscreen mode clear button
 * `toggle-button`       | Fullscreen mode toggle button
 * `years-toggle-button` | Fullscreen mode years scroller toggle
 * `toolbar`             | Footer bar with slotted buttons
 *
 * The following state attributes are available on the `<vaadin-date-picker-overlay-content>` element:
 *
 * Attribute       | Description
 * ----------------|-------------------------------------------------
 * `desktop`       | Set when the overlay content is in desktop mode
 * `fullscreen`    | Set when the overlay content is in fullscreen mode
 * `years-visible` | Set when the year scroller is visible in fullscreen mode
 *
 * In order to style the month calendar, use `<vaadin-month-calendar>` shadow DOM parts:
 *
 * Part name             | Description
 * ----------------------|--------------------
 * `month-header`        | Month title
 * `weekdays`            | Weekday container
 * `weekday`             | Weekday element
 * `week-numbers`        | Week numbers container
 * `week-number`         | Week number element
 * `date`                | Date element
 * `disabled`            | Disabled date element
 * `focused`             | Focused date element
 * `selected`            | Selected date element
 * `today`               | Date element corresponding to the current day
 *
 * In order to style year scroller elements, use `<vaadin-date-picker-year>` shadow DOM parts:
 *
 * Part name             | Description
 * ----------------------|--------------------
 * `year-number`         | Year number
 * `year-separator`      | Year separator
 *
 * Note: the `theme` attribute value set on `<vaadin-date-picker>` is
 * propagated to the internal components listed above.
 *
 * See [Styling Components](https://vaadin.com/docs/latest/styling/styling-components) documentation.
 *
 * @fires {Event} change - Fired when the user commits a value change.
 * @fires {CustomEvent} invalid-changed - Fired when the `invalid` property changes.
 * @fires {CustomEvent} opened-changed - Fired when the `opened` property changes.
 * @fires {CustomEvent} value-changed - Fired when the `value` property changes.
 * @fires {CustomEvent} validated - Fired whenever the field is validated.
 *
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @mixes InputControlMixin
 * @mixes DatePickerMixin
 */
class DatePicker extends DatePickerMixin(InputControlMixin(ThemableMixin(ElementMixin(PolylitMixin(LitElement))))) {
  static get is() {
    return 'vaadin-date-picker';
  }

  static get styles() {
    return [
      inputFieldShared,
      css`
        :host([opened]) {
          pointer-events: auto;
        }

        :host([dir='rtl']) [part='input-field'] {
          direction: ltr;
        }

        :host([dir='rtl']) [part='input-field'] ::slotted(input)::placeholder {
          direction: rtl;
          text-align: left;
        }
      `,
    ];
  }

  static get properties() {
    return {
      /** @private */
      _positionTarget: {
        type: Object,
        sync: true,
      },
    };
  }

  /**
   * Used by `InputControlMixin` as a reference to the clear button element.
   * @protected
   * @return {!HTMLElement}
   */
  get clearElement() {
    return this.$.clearButton;
  }

  /** @protected */
  render() {
    return html`
      <div class="vaadin-date-picker-container">
        <div part="label">
          <slot name="label"></slot>
          <span part="required-indicator" aria-hidden="true" @click="${this.focus}"></span>
        </div>

        <vaadin-input-container
          part="input-field"
          .readonly="${this.readonly}"
          .disabled="${this.disabled}"
          .invalid="${this.invalid}"
          theme="${ifDefined(this._theme)}"
        >
          <slot name="prefix" slot="prefix"></slot>
          <slot name="input"></slot>
          <div id="clearButton" part="clear-button" slot="suffix" aria-hidden="true"></div>
          <div part="toggle-button" slot="suffix" aria-hidden="true" @click="${this._toggle}"></div>
        </vaadin-input-container>

        <div part="helper-text">
          <slot name="helper"></slot>
        </div>

        <div part="error-message">
          <slot name="error-message"></slot>
        </div>
      </div>

      <vaadin-date-picker-overlay
        id="overlay"
        ?fullscreen="${this._fullscreen}"
        theme="${ifDefined(this._theme)}"
        .opened="${this.opened}"
        @opened-changed="${this._onOpenedChanged}"
        @vaadin-overlay-escape-press="${this._onOverlayEscapePress}"
        @vaadin-overlay-open="${this._onOverlayOpened}"
        @vaadin-overlay-close="${this._onVaadinOverlayClose}"
        @vaadin-overlay-closing="${this._onOverlayClosed}"
        restore-focus-on-close
        no-vertical-overlap
        .restoreFocusNode="${this.inputElement}"
        .positionTarget="${this._positionTarget}"
      ></vaadin-date-picker-overlay>

      <slot name="tooltip"></slot>
    `;
  }

  /** @protected */
  ready() {
    super.ready();

    this.addController(
      new InputController(this, (input) => {
        this._setInputElement(input);
        this._setFocusElement(input);
        this.stateTarget = input;
        this.ariaTarget = input;
      }),
    );
    this.addController(new LabelledInputController(this.inputElement, this._labelController));

    this._tooltipController = new TooltipController(this);
    this.addController(this._tooltipController);
    this._tooltipController.setPosition('top');
    this._tooltipController.setShouldShow((target) => !target.opened);

    this._positionTarget = this.shadowRoot.querySelector('[part="input-field"]');

    const toggleButton = this.shadowRoot.querySelector('[part="toggle-button"]');
    toggleButton.addEventListener('mousedown', (e) => e.preventDefault());
  }

  /** @private */
  _onOpenedChanged(event) {
    this.opened = event.detail.value;
  }

  /** @private */
  _onVaadinOverlayClose(e) {
    if (e.detail.sourceEvent && e.detail.sourceEvent.composedPath().includes(this)) {
      e.preventDefault();
    }
  }

  /** @private */
  _toggle(e) {
    e.stopPropagation();
    if (this.$.overlay.opened) {
      this.close();
    } else {
      this.open();
    }
  }
}

customElements.define(DatePicker.is, DatePicker);

export { DatePicker };
