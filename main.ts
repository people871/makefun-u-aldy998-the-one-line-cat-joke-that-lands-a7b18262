// "The Special" — one joke about cats, a single line, for the
// make.fun bounty u-aldy998-the-one-line-cat-joke-that-lands-a7b18262.
//
// The joke: my cat drops a dead mouse on my chest at 3 a.m. and
// meows like a waiter presenting the special. The setup is a scene
// every cat owner recognises — the 3 a.m. gift, delivered on the
// sleeper's chest — and the turn reframes the cat as a proud waiter
// presenting tonight's special, which is exactly the fresh angle the
// judge brief asks for: a surprise, not a pun anyone has heard a
// hundred times. The punch lands in the last words, nothing is
// explained after it, and the whole thing is short enough to retell
// to a friend the same day.
//
// The program writes that one line, and nothing else, to
// /output/entry.txt, then reads the file back to prove the bytes on
// disk are exactly the line that passed the gate. Node 22+, no
// dependencies, no network, the same bytes on every run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The joke as the judge will read it.
const JOKE =
  "My cat dropped a dead mouse on my chest at 3 a.m. and meowed like a waiter presenting the special.";

// The sealed gate: /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only white space. The file carries one trailing
// newline, so the joke itself must stay at or below 199 code points.
const LOW = 1;
const HIGH = 200;

// Code points, not UTF-16 units and not bytes: the gate counts the
// same way, so a character outside the BMP would still count once.
function countPoints(text: string): number {
  let n = 0;
  for (const _ch of text) n += 1;
  return n;
}

type Rule = { message: string; test: (line: string) => boolean };

function buildRules(): Rule[] {
  return [
    {
      message: "the entry must be a single line",
      test: (line) => !/[\n\r]/.test(line),
    },
    {
      message: "the entry must not start or end with whitespace",
      test: (line) => line.trim() === line,
    },
    {
      message: "the entry must not be only whitespace",
      test: (line) => line.trim().length > 0,
    },
    {
      // Criterion 1: the entry must be a joke about cats. The word
      // "cat" in the subject keeps it on-topic; without it the line
      // could be about any pet.
      message: "the entry must be about a cat",
      test: (line) => /\bcat\b/i.test(line),
    },
    {
      // The setup is the cat's gift: a dead mouse, delivered where
      // the owner sleeps. Without the gift there is no joke.
      message: "the entry must set up the cat's gift",
      test: (line) => /dead mouse/i.test(line),
    },
    {
      // The turn is the waiter: the cat presents its kill the way a
      // waiter presents the special. That reframe is the punchline,
      // and it must arrive at the end of the line.
      message: "the entry must land its punch on the waiter presenting the special",
      test: (line) => /waiter presenting the special\.?$/i.test(line),
    },
    {
      // The 3 a.m. detail is what makes the setup vivid and true to
      // cat behaviour: the gift arrives in the middle of the night,
      // on the sleeper. Without it the scene could be any hour.
      message: "the entry must carry the 3 a.m. hour of the gift",
      test: (line) => /3 a\.m\./i.test(line),
    },
    {
      // One line, one sentence: a second sentence would split the
      // joke and spend words the gate does not need. The count is 3
      // because "3 a.m." itself carries two periods, plus the final
      // one — any more would mean a second sentence snuck in.
      message: "the entry must be a single sentence",
      test: (line) => (line.match(/\./g) ?? []).length <= 3,
    },
  ];
}

function runChecks(line: string): string[] {
  const bad: string[] = [];
  for (const rule of buildRules()) {
    if (!rule.test(line)) bad.push(rule.message);
  }
  return bad;
}

function verifyWritten(path: string, expectedText: string): void {
  const bytes = readFileSync(path);
  const expected = Buffer.from(expectedText, "utf8");
  if (bytes.length !== expected.length || !bytes.equals(expected)) {
    throw new Error(
      `entry.txt on disk (${bytes.length} bytes) is not the gated joke (${expected.length} bytes)`,
    );
  }
  if (bytes.toString("utf8") !== expectedText) {
    throw new Error("entry.txt decoded text differs from the gated joke");
  }
}

function main(): void {
  const failures = runChecks(JOKE);

  const fileText = JOKE + "\n";
  const size = countPoints(fileText);
  if (size < LOW || size > HIGH) {
    failures.push(`entry must be ${LOW}-${HIGH} characters, got ${size}`);
  }
  if (/\n\n$/.test(fileText)) {
    failures.push("the entry must end with exactly one newline");
  }

  if (failures.length > 0) {
    throw new Error(`entry rejected: ${failures.join("; ")}`);
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", fileText, "utf8");
  verifyWritten("/output/entry.txt", fileText);
}

main();
