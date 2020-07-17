/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const SizedImagesAudit = require('../../audits/sized-images.js');

/* eslint-env jest */

function generateImage(props, src = 'https://google.com/logo.png', isCss = false,
  path = '1,HTML,1,BODY,1,IMG', selector = 'body > img', nodeLabel = 'img',
  snippet = '<img src="cat.jpg">') {
  const image = {src, isCss, path, selector, nodeLabel, snippet};
  Object.assign(image, props);
  return image;
}

describe('Sized images audit', () => {
  function testImage(condition, data) {
    const description = `handles when an image ${condition}`;
    it(description, async () => {
      const result = SizedImagesAudit.audit({
        ImageElements: [
          generateImage(
            data.props
          ),
        ],
      });
      expect(result.score).toEqual(data.score);
    });
  }

  testImage('is a css image', {
    score: 1,
    props: {
      isCss: true,
      attributeWidth: '',
      attributeHeight: '',
    },
  });

  describe('has empty', () => {
    testImage('has empty width attribute', {
      score: 0,
      props: {
        attributeWidth: '',
        attributeHeight: '100',
      },
    });

    testImage('has empty height attribute', {
      score: 0,
      props: {
        attributeWidth: '100',
        attributeHeight: '',
      },
    });

    testImage('has empty width and height attributes', {
      score: 0,
      props: {
        attributeWidth: '',
        attributeHeight: '',
      },
    });
  });

  describe('has invalid', () => {
    testImage('has invalid width attribute', {
      score: 0,
      props: {
        attributeWidth: '-200',
        attributeHeight: '100',
      },
    });

    testImage('has invalid height attribute', {
      score: 0,
      props: {
        attributeWidth: '100',
        attributeHeight: '300.5',
      },
    });

    testImage('has invalid width and height attributes', {
      score: 0,
      props: {
        attributeWidth: '0',
        attributeHeight: '100/2',
      },
    });
  });

  testImage('has valid width and height attributes', {
    score: 1,
    props: {
      attributeWidth: '100',
      attributeHeight: '100',
    },
  });

  it('is not applicable when there are no images', async () => {
    const result = SizedImagesAudit.audit({
      ImageElements: [],
    });
    expect(result.notApplicable).toEqual(true);
    expect(result.score).toEqual(1);
  });

  it('can return multiple unsized images', async () => {
    const result = SizedImagesAudit.audit({
      ImageElements: [
        generateImage(
          {
            attributeWidth: '100',
            attributeHeight: '150',
          },
          'image1.png'
        ),
        generateImage(
          {
            attributeWidth: '',
            attributeHeight: '',
          },
          'image2.png'
        ),
        generateImage(
          {
            attributeWidth: '200',
            attributeHeight: '75',
          },
          'image3.png'
        ),
      ],
    });
    expect(result.score).toEqual(0);
    expect(result.details.items).toHaveLength(2);
    const srcs = result.details.items.map(item => item.url);
    expect(srcs).toEqual(['image1.png', 'image3.png']);
  });
});

describe('Size attribute validity check', () => {
  it('fails on non-numeric characters', async () => {
    expect(SizedImagesAudit.isValid('zero')).toEqual(false);
    expect(SizedImagesAudit.isValid('1002$')).toEqual(false);
    expect(SizedImagesAudit.isValid('s-5')).toEqual(false);
    expect(SizedImagesAudit.isValid('3,000')).toEqual(false);
    expect(SizedImagesAudit.isValid('100.0')).toEqual(false);
    expect(SizedImagesAudit.isValid('2/3')).toEqual(false);
    expect(SizedImagesAudit.isValid('-2020')).toEqual(false);
    expect(SizedImagesAudit.isValid('+2020')).toEqual(false);
  });

  it('fails on zero input', async () => {
    expect(SizedImagesAudit.isValid('0')).toEqual(false);
  });

  it('passes on non-zero non-negative integer input', async () => {
    expect(SizedImagesAudit.isValid('1')).toEqual(true);
    expect(SizedImagesAudit.isValid('250')).toEqual(true);
    expect(SizedImagesAudit.isValid('4000000')).toEqual(true);
  });
});
