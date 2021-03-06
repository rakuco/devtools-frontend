// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type * as ElementsModule from '../../../../front_end/elements/elements.js';
import {describeWithEnvironment} from '../helpers/EnvironmentHelpers.js';
import {assertElement, assertShadowRoot, getEventPromise, renderElementIntoDOM} from '../helpers/DOMHelpers.js';

const {assert} = chai;

describeWithEnvironment('LayoutPane', async () => {
  let Elements: typeof ElementsModule;
  before(async () => {
    Elements = await import('../../../../front_end/elements/elements.js');
  });

  function queryLabels(component: HTMLElement, selector: string) {
    assertShadowRoot(component.shadowRoot);
    return Array.from(component.shadowRoot.querySelectorAll(selector)).map(label => {
      return {
        label: label.getAttribute('title'),
        input: label.querySelector('[data-input]')!.tagName,
      };
    });
  }

  it('renders settings', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      gridElements: [],
      settings: [
        {
          name: 'booleanSetting',
          type: Elements.LayoutPaneUtils.SettingType.BOOLEAN,
          value: false,
          title: 'Boolean setting title',
          options: [
            {
              title: 'Set true',
              value: true,
            },
            {
              title: 'Set false',
              value: false,
            },
          ],
        },
        {
          name: 'enumSetting',
          type: Elements.LayoutPaneUtils.SettingType.ENUM,
          value: 'both',
          title: 'Enum setting title',
          options: [
            {
              title: 'Set both',
              value: 'both',
            },
            {
              title: 'Set none',
              value: 'none',
            },
          ],
        },
      ],
    };


    assert.deepEqual(queryLabels(component, '[data-enum-setting]'), [{label: 'Enum setting title', input: 'SELECT'}]);
    assert.deepEqual(
        queryLabels(component, '[data-boolean-setting]'), [{label: 'Boolean setting title', input: 'INPUT'}]);
  });

  it('sends event when a setting is changed', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      gridElements: [],
      settings: [
        {
          name: 'booleanSetting',
          type: Elements.LayoutPaneUtils.SettingType.BOOLEAN,
          value: false,
          title: 'Boolean setting title',
          options: [
            {
              title: 'Set true',
              value: true,
            },
            {
              title: 'Set false',
              value: false,
            },
          ],
        },
      ],
    };

    assertShadowRoot(component.shadowRoot);

    const input = component.shadowRoot.querySelector('[data-input]');
    assertElement(input, HTMLInputElement);

    const eventPromise = getEventPromise<ElementsModule.LayoutPane.SettingChangedEvent>(component, 'setting-changed');

    input.click();

    const event = await eventPromise;
    assert.deepEqual(event.data, {setting: 'booleanSetting', value: true});
  });

  it('renders grid elements', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      gridElements: [
        {
          id: 1,
          color: 'red',
          name: 'div',
          domId: 'elementId',
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
        {
          id: 2,
          color: 'blue',
          name: 'span',
          domClasses: ['class1', 'class2'],
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
        {
          id: 3,
          color: 'green',
          name: 'div',
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
      ],
      settings: [],
    };

    assertShadowRoot(component.shadowRoot);

    assert.strictEqual(queryLabels(component, '[data-element]').length, 3);
  });

  it('renders flex elements', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    renderElementIntoDOM(component);

    component.data = {
      gridElements: [],
      flexContainerElements: [
        {
          id: 1,
          color: 'red',
          name: 'div',
          domId: 'elementId',
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
        {
          id: 2,
          color: 'blue',
          name: 'span',
          domClasses: ['class1', 'class2'],
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
        {
          id: 3,
          color: 'green',
          name: 'div',
          enabled: false,
          reveal: () => {},
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
      ],
      settings: [],
    };

    assertShadowRoot(component.shadowRoot);

    assert.strictEqual(queryLabels(component, '[data-element]').length, 3);
  });

  it('send an event when an element overlay is toggled', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    renderElementIntoDOM(component);

    let called = 0;
    component.data = {
      gridElements: [
        {
          id: 1,
          color: 'red',
          name: 'div',
          enabled: false,
          reveal: () => {},
          toggle: value => {
            called++;
            assert.strictEqual(value, true);
          },
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
      ],
      settings: [],
    };

    assertShadowRoot(component.shadowRoot);

    const input = component.shadowRoot.querySelector('[data-input]');
    assertElement(input, HTMLInputElement);
    input.click();
    assert.strictEqual(called, 1);
  });

  it('send an event when an element’s Show element button is pressed', async () => {
    const component = new Elements.LayoutPane.LayoutPane();
    let called = 0;
    component.data = {
      gridElements: [
        {
          id: 1,
          color: 'red',
          name: 'div',
          enabled: false,
          reveal: () => {
            called++;
          },
          toggle: () => {},
          setColor: () => {},
          highlight: () => {},
          hideHighlight: () => {},
        },
      ],
      settings: [],
    };
    renderElementIntoDOM(component);
    assertShadowRoot(component.shadowRoot);
    const button = component.shadowRoot.querySelector('button.show-element');
    assertElement(button, HTMLButtonElement);
    button.click();
    assert.strictEqual(called, 1);
  });
});
