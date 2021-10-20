/**
 * @license
 * Copyright (c) 2021 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { css } from 'lit';

export const inputFieldContainer = css`
  [class$='container'] {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  [class$='container']:not([class$='group-field-container']) {
    min-width: 100%;
    max-width: 100%;
    width: var(--vaadin-field-default-width, 12em);
  }

  :host([label-position='aside']) [class$='container'] {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    grid-template-rows: min-content min-content 1fr;
    width: auto;
    grid-column-gap: var(--vaadin-form-item-label-spacing);
  }

  :host([label-position='aside']) [part='label'] {
    width: var(--vaadin-form-item-label-width);
    grid-row-start: 1;
    grid-row-end: -1;
  }

  :host([label-position='aside']) [part='input-field'],
  :host([label-position='aside']) [part='helper-text'],
  :host([label-position='aside']) [part='error-message'] {
    grid-column: 2;
    align-self: flex-start;
    min-width: 100%;
    max-width: 100%;
    width: var(--vaadin-field-default-width, 12em);
  }
`;
