# E2E Journey Suites

Dedicated end-to-end specs that exercise multi-page user flows across the Demo Shop.

## Tagging

All specs use `@e2e` in the describe title. Run them with:

```bash
npm run test:e2e
```

## Journeys

| Spec | Scenario |
|---|---|
| `purchase-journey.spec.ts` | Guest browse → login → purchase (desktop and mobile) |
| `checkout-guest.spec.ts` | Guest checkout auth guard |
| `cart-journey.spec.ts` | Cart persistence and quantity management |
| `returning-customer.spec.ts` | Logged-in customer checkout without auth redirect |
| `explored/*.spec.ts` | Drafts generated from exploration findings (`npm run explore:draft`); see `explored/README.md` |
| `mcp-explored-journeys.spec.ts` | Scenarios found with Playwright MCP: multi-item totals, quantities, cart after logout, post-order states, login retry and redirect safety, whitespace-only name |

## Conventions

- Reuse page objects from `tests/pages/`
- Reuse test data from `tests/data/`
- Reuse setup helpers from `tests/fixtures/`
- Shared journey steps live in `helpers/` when used by multiple specs
