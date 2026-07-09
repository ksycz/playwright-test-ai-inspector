import { mergeTests } from '@playwright/test';
import { authTest } from './auth.fixture';
import { cartTest } from './cart.fixture';

export const test = mergeTests(authTest, cartTest);

export { expect } from '@playwright/test';
export { loginViaUi } from './auth.fixture';
export { addSampleProductToCart } from './cart.fixture';
