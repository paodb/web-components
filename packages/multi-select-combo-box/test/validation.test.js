import { expect } from '@esm-bundle/chai';
import { fixtureSync, nextRender, outsideClick } from '@vaadin/testing-helpers';
import { sendKeys } from '@web/test-runner-commands';
import sinon from 'sinon';
import './not-animated-styles.js';
import '../vaadin-multi-select-combo-box.js';

describe('validation', () => {
  let comboBox, validateSpy, changeSpy, input;

  describe('initial', () => {
    beforeEach(() => {
      comboBox = document.createElement('vaadin-multi-select-combo-box');
      comboBox.items = ['apple', 'banana'];
      validateSpy = sinon.spy(comboBox, 'validate');
    });

    afterEach(() => {
      comboBox.remove();
    });

    it('should not validate by default', async () => {
      document.body.appendChild(comboBox);
      await nextRender();
      expect(validateSpy.called).to.be.false;
    });

    it('should not validate when the field has an initial value', async () => {
      comboBox.selectedItems = ['apple'];
      document.body.appendChild(comboBox);
      await nextRender();
      expect(validateSpy.called).to.be.false;
    });

    it('should not validate when the field has an initial value and invalid', async () => {
      comboBox.selectedItems = ['apple'];
      comboBox.invalid = true;
      document.body.appendChild(comboBox);
      await nextRender();
      expect(validateSpy.called).to.be.false;
    });
  });

  describe('basic', () => {
    beforeEach(() => {
      comboBox = fixtureSync(`<vaadin-multi-select-combo-box></vaadin-multi-select-combo-box>`);
      comboBox.items = ['apple', 'banana'];
      input = comboBox.inputElement;
      validateSpy = sinon.spy(comboBox, 'validate');
      changeSpy = sinon.spy();
      comboBox.addEventListener('change', changeSpy);
    });

    it('should not validate on blur by default', () => {
      input.focus();
      input.blur();
      expect(validateSpy.called).to.be.false;
    });

    it('should validate on blur when dirty', () => {
      comboBox.dirty = true;
      input.focus();
      input.blur();
      expect(validateSpy.calledOnce).to.be.true;
    });

    it('should not validate on outside click by default', () => {
      input.focus();
      input.click();
      outsideClick();
      expect(validateSpy.called).to.be.false;
    });

    it('should validate on outside click when dirty', () => {
      comboBox.dirty = true;
      input.focus();
      input.click();
      outsideClick();
      expect(validateSpy.calledOnce).to.be.true;
    });

    it('should validate before change event on Enter', async () => {
      input.focus();
      await sendKeys({ type: 'apple' });
      await sendKeys({ press: 'Enter' });
      expect(changeSpy.calledOnce).to.be.true;
      expect(validateSpy.calledOnce).to.be.true;
      expect(validateSpy.calledBefore(changeSpy)).to.be.true;
    });

    it('should validate before change event on clear button click', () => {
      comboBox.clearButtonVisible = true;
      comboBox.value = 'apple';
      validateSpy.resetHistory();
      comboBox.$.clearButton.click();
      expect(changeSpy.calledOnce).to.be.true;
      expect(validateSpy.calledOnce).to.be.true;
      expect(validateSpy.calledBefore(changeSpy)).to.be.true;
    });

    it('should not validate on required change when no items are selected', () => {
      comboBox.required = true;
      expect(validateSpy.called).to.be.false;
      comboBox.required = false;
      expect(validateSpy.called).to.be.false;
    });
  });

  describe('required', () => {
    beforeEach(() => {
      comboBox = fixtureSync(`<vaadin-multi-select-combo-box required></vaadin-multi-select-combo-box>`);
      comboBox.items = ['apple', 'banana'];
    });

    it('should fail validation when selectedItems is empty', () => {
      expect(comboBox.checkValidity()).to.be.false;
    });

    it('should pass validation when selectedItems is empty and readonly', () => {
      comboBox.readonly = true;
      expect(comboBox.checkValidity()).to.be.true;
    });

    it('should pass validation when selectedItems is not empty', () => {
      comboBox.selectedItems = ['apple'];
      expect(comboBox.checkValidity()).to.be.true;
    });
  });
});
