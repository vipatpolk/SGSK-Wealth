import { DataTable, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { spec } from 'pactum';

let currentSpec: ReturnType<typeof spec>;
let lastResponse: any;

When('I send an unauthorized GET request to {string}', async (endpoint: string) => {
  currentSpec = spec();
  lastResponse = await currentSpec.get(endpoint).withHeaders('X-API-Key', '').toss();
});

When(
  'I send a request to {string} with custom header {string} value {string}',
  async (endpoint: string, headerName: string, headerValue: string) => {
    currentSpec = spec();
    lastResponse = await currentSpec.get(endpoint).withHeaders(headerName, headerValue).toss();
  }
);

When(
  'I send a GET request to {string} with params:',
  async (endpoint: string, dataTable: DataTable) => {
    currentSpec = spec();
    const params = Object.fromEntries(dataTable.raw());
    lastResponse = await currentSpec.get(endpoint).withQueryParams(params).toss();
  }
);

When(
  'I send a POST request to {string} with payload:',
  async (endpoint: string, docString: string) => {
    currentSpec = spec();
    const payload = JSON.parse(docString);
    lastResponse = await currentSpec.post(endpoint).withJson(payload).toss();
  }
);

Then('the response status should be {int}', (statusCode: number) => {
  currentSpec.response().should.have.status(statusCode);
});

Then('the response time should be within {int} ms', (maxMs: number) => {
  currentSpec.response().should.have.responseTimeLessThan(maxMs);
});

Then('the response JSON should contain:', (docString: string) => {
  const expected = JSON.parse(docString);
  currentSpec.response().should.have.jsonLike(expected);
});

Then('the response should contain a positive number property {string}', (property: string) => {
  const body = lastResponse?.json || lastResponse?.body;
  expect(body).toHaveProperty(property);
  expect(typeof body[property]).toBe('number');
  expect(body[property]).toBeGreaterThan(0);
});
