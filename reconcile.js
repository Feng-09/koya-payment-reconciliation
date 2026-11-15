// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

// Latest attempt per txn_id wins. Skip lines that don't parse as a JSON
// object and events without a txn_id. Amounts may be numbers or
// comma-grouped strings like "4,804.15".
const latest = new Map();
const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.trim().length > 0);
for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }
  if (!event || typeof event !== "object" || Array.isArray(event) || !event.txn_id) {
    continue;
  }

  const prev = latest.get(event.txn_id);
  if (!prev || Date.parse(event.ts) > Date.parse(prev.ts)) {
    latest.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
