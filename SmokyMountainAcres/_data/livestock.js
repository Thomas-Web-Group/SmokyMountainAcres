const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const dir = path.join(__dirname, "..", "content", "animals");

// Last commit time of the file, so the most recently updated sold/pending animal sorts first.
function changedAt(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", file], { cwd: dir, encoding: "utf8" }).trim();
    return Number(out) || 0;
  } catch (e) {
    return 0;
  }
}

function load() {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try {
        const animal = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        animal._changedAt = animal.sold === true || animal.pending === true ? changedAt(file) : 0;
        return animal;
      } catch (e) {
        console.warn(`Skipping invalid animal file ${file}: ${e.message}`);
        return null;
      }
    })
    .filter((animal) => animal && animal.name && animal.available === true);
}

const order = (animal) => (animal.order === "" || animal.order == null || !Number.isFinite(Number(animal.order)) ? 9999 : Number(animal.order));
const hasStatus = (animal) => animal.sold === true || animal.pending === true;

// Featured first, then sold/pending (newest first), then display order, then name.
module.exports = () => load().sort(
  (a, b) =>
    Number(b.featured === true) - Number(a.featured === true) ||
    Number(hasStatus(b)) - Number(hasStatus(a)) ||
    b._changedAt - a._changedAt ||
    order(a) - order(b) ||
    a.name.localeCompare(b.name)
);
