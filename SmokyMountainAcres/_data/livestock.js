const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "content", "animals");

function load() {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      } catch (e) {
        console.warn(`Skipping invalid animal file ${file}: ${e.message}`);
        return null;
      }
    })
    .filter((animal) => animal && animal.name && animal.available === true);
}

const order = (animal) => (animal.order === "" || animal.order == null || !Number.isFinite(Number(animal.order)) ? 9999 : Number(animal.order));

// Featured first, then display order, then name.
module.exports = () => load().sort(
  (a, b) =>
    Number(b.featured === true) - Number(a.featured === true) ||
    order(a) - order(b) ||
    a.name.localeCompare(b.name)
);
