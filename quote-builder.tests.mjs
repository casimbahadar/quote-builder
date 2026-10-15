// node quote-builder.tests.mjs
// Runs the CORE block extracted from the shipped index.html. Expected figures were worked out by hand first.
import { readFileSync, existsSync } from "node:fs";
const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const core = read("./index.html").split("/* CORE-START")[1].split("/* CORE-END */")[0].replace(/^[^\n]*\n/, "");
const Q = new Function(core + "\nreturn Quote;")();
let pass = 0, fail = 0;
const check = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log("FAIL " + name + (detail !== undefined ? "  :: " + JSON.stringify(detail).slice(0, 300) : "")); } };
const TODAY = "2026-10-15";
const [drain, faucet, heater] = Q.samples(TODAY);
const fig = q => { const c = Q.compute(q); return [c.subtotal, c.discount, c.hst, c.total, c.deposit, c.balance]; };
check("drain clearing: $390.99, HST $50.83, total $441.82, no deposit", JSON.stringify(fig(drain)) === JSON.stringify([39099, 0, 5083, 44182, 0, 44182]), fig(drain));
check("faucet install: 10% off $300.00 of labour = $30.00, HST $72.63, total $631.33, deposit $157.83, balance $473.50", JSON.stringify(fig(faucet)) === JSON.stringify([58870, 3000, 7263, 63133, 15783, 47350]), fig(faucet));
check("water heater: $2,093.80, HST $272.19, total $2,365.99, 50% deposit $1,183.00, balance $1,182.99", JSON.stringify(fig(heater)) === JSON.stringify([209380, 0, 27219, 236599, 118300, 118299]), fig(heater));
const perLine = Q.compute(heater).lines.reduce((t, l) => t + Q.mulDiv(l.total, 13, 100), 0);
check("HST is worked out once on the subtotal: $272.19, not the $272.20 that line-by-line rounding gives", perLine === 27220 && Q.compute(heater).hst === 27219, perLine);
check("a half cent rounds up: 50% of $2,365.99 is $1,183.00", Q.mulDiv(236599, 5000, 10000) === 118300);
check("discount on the whole subtotal", (() => { const q = JSON.parse(JSON.stringify(faucet)); q.discountScope = "all"; const c = Q.compute(q); return c.discount === 5887 && c.taxable === 52983; })());
check("valid until is the quote date plus the days", Q.compute(drain).validUntil === "2026-11-14");
check("money and quantities as people type them", Q.toCents("1,289.00") === 128900 && Q.toCents("$45") === 4500 && Q.toCents("12.3") === 1230 && Q.toCents("abc") === null && Q.toCents("-5") === null
  && Q.toMilli("1.5") === 1500 && Q.toMilli("1,5") === 1500 && Q.toMilli("0.25") === 250 && Q.toMilli("-1") === null);
// validation
const v = (patch, linePatch) => { const q = JSON.parse(JSON.stringify(drain)); Object.assign(q, patch); if (linePatch) Object.assign(q.lines[0], linePatch); return Q.validate(q, TODAY); };
check("a sample quote has no problems", Object.keys(v({})).length === 0, v({}));
check("empty customer name", "name" in v({ customer: { name: " ", phone: "", email: "", address: "" } }));
check("empty job", "job" in v({ job: "" }));
check("no line items", "lines" in v({ lines: [] }));
check("zero quantity", /more than 0/.test(v({}, { qty: "0" })["qty-0"] || ""));
check("negative quantity", "qty-0" in v({}, { qty: "-2" }));
check("price that isn't a number", "price-0" in v({}, { price: "lots" }));
check("discount over 100%", "discount" in v({ discountPct: "101" }));
check("deposit over 100%", "deposit" in v({ depositPct: "150" }));
check("a quote that would already have expired", /already have expired/.test(v({ date: "2026-01-01", validDays: "30" }).validDays || ""));
check("valid days out of range", "validDays" in v({ validDays: "0" }) && "validDays" in v({ validDays: "400" }));
// outputs
const c = Q.compute(faucet);
const msg = Q.message(faucet, c);
check("message: first name, quote number, total with HST, deposit, balance, expiry", msg.startsWith("Hi Grace, here's your quote CC-Q-1042") && msg.includes("$631.33, including 13% HST") && msg.includes("$157.83 (25%)") && msg.includes("$473.50") && msg.includes("November 14, 2026"), msg);
const evil = JSON.parse(JSON.stringify(faucet)); evil.job = '=HYPERLINK("x")'; evil.customer.name = "+cmd";
const log = Q.toCSV(Q.LOG_HEAD, [Q.logRow(evil, Q.compute(evil), "Sent")]);
check("quote log: cells starting with = or + become text", log.includes(`"'=HYPERLINK(""x"")"`) && log.includes(",'+cmd,"), log.split("\r\n")[1]);
check("quote log: 15 columns with the right figures", log.split("\r\n")[1].split(",").length >= 15 && log.includes(",588.70,30.00,72.63,631.33,157.83,473.50"), log.split("\r\n")[1]);
const job = Q.jobRow(faucet, c, TODAY);
check("job row: 18 columns, quote number as the job number, status New", job.length === 18 && job[0] === "CC-Q-1042" && job[2] === "New" && job[6] === "Grace Liu");
if (existsSync(new URL("./job-intake-reference.html", import.meta.url))) {
  const ref = read("./job-intake-reference.html").match(/const CSV_HEAD = (\[[^\]]+\])/)[1];
  check("job row header is exactly the job intake demo's 18 columns", JSON.stringify(Q.JOB_HEAD) === JSON.stringify(JSON.parse(ref)), [Q.JOB_HEAD, ref]);
}
// speed
const big = JSON.parse(JSON.stringify(heater)); big.lines = Array.from({ length: 5000 }, (_, i) => Q.line(Q.PRICES[i % Q.PRICES.length].code, 1 + (i % 7) * 0.5));
const t0 = performance.now(); const bc = Q.compute(big); const ve = Q.validate(big, TODAY); const ms = performance.now() - t0;
check(`5,000 line items worked out and checked in ${ms.toFixed(1)} ms (under 200)`, ms < 200 && bc.lines.length === 5000 && Object.keys(ve).length === 0);
check("totals add up exactly at 5,000 lines", bc.subtotal === bc.lines.reduce((s, l) => s + l.total, 0) && bc.total === bc.taxable + bc.hst);
console.log(`\n${pass}/${pass + fail} tests passed`);
process.exit(fail ? 1 : 0);
