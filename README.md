# Job quote builder (demo)

Build a quote for Cedar & Copper Plumbing, a made-up company. Pick items from a made-up price list and get a printable quote with 13% HST, a deposit and an expiry date. It also produces a message to send with it and spreadsheet rows. Everything runs in the browser.

Live: https://casimbahadar.github.io/quote-builder/

## What a visitor does

1. Opens one of three sample quotes, or starts a blank one.
2. Edits the customer, the job and the line items. Each item comes from the price list or is a custom one. They can set the quantity, a discount (on the whole subtotal or on labour only), a deposit, and how many days the quote is valid.
3. Gets:
   - the finished quote, which updates as they type, with the arithmetic shown under it
   - Print or save as PDF, through the device's own print option (on an iPhone: Share, then Print, then Save to Files)
   - a message to send with the quote, ready to copy
   - a quote log row for a spreadsheet
   - Mark as accepted, which downloads a job row in the same 18 columns as the job intake demo (https://casimbahadar.github.io/job-intake/)

Problems are listed only when the visitor tries to print or download, so nothing nags while they type. Each problem links to its field:
- a missing customer name or job
- a quantity of zero or less
- a price that isn't a number
- a discount or deposit over 100%
- a quote that would already have expired

## How the totals are worked out

- Line amount = quantity × price, rounded to the nearest cent.
- Discount = the discount percentage of the subtotal, or of the labour lines only.
- HST = 13% of the subtotal after the discount, worked out once and rounded to the nearest cent.
- Total = subtotal after discount + HST.
- Deposit = the deposit percentage of the total. Balance = total − deposit.

Half a cent rounds up. All arithmetic is done in whole cents, so floating-point rounding can't shift a cent.

HST is worked out once, not line by line. On the water heater sample, line-by-line rounding would give $272.20 instead of $272.19.

## Sample quotes, checked to the cent

| | Subtotal | Discount | HST | Total | Deposit | Balance |
|---|---|---|---|---|---|---|
| Drain clearing | $390.99 | none | $50.83 | $441.82 | none | $441.82 |
| Faucet install | $588.70 | 10% of $300.00 labour = $30.00 | $72.63 | $631.33 | 25% = $157.83 | $473.50 |
| Water heater | $2,093.80 | none | $272.19 | $2,365.99 | 50% = $1,183.00 | $1,182.99 |

These were worked out by hand before the page was built, and the tests check the page against them.

## Privacy

Nothing leaves the page. Its security settings block every network request, and anything typed in is shown as plain text, never run as code. The quote being worked on is kept in this browser tab only (sessionStorage), so a reload doesn't lose it, and closing the tab clears it. A note says when an earlier quote has been brought back, with a Start over button.

## Files

- `index.html`: the whole page. The arithmetic and checks sit between the `CORE-START` and `CORE-END` markers.
- `quote-builder.tests.mjs`: checks a developer can run with Node (`node quote-builder.tests.mjs`). They cover the three samples to the cent, rounding, every validation rule, the spreadsheet rows and speed at 5,000 line items. If a copy of the job intake demo's page is saved next to it as `job-intake-reference.html`, it also confirms the job row uses exactly the same 18 columns.
- `.nojekyll`: tells GitHub Pages to serve the files as they are.

## How a version for your business would differ

It would use your own price list, terms and logo. It could save every quote, send quotes by email from your own address, remind you before a quote expires, and add accepted quotes straight to your job list or accounting software.

## How AI was used to build this

The page was written with an AI coding assistant. It was checked by the tests above, by headless browser tests (including the printed PDF), by a UI audit at three screen widths, and by a security scan. No AI runs on the page itself.

Built by Casim Bahadar, Kitchener-Waterloo, Ontario. https://casimbahadar.github.io/
