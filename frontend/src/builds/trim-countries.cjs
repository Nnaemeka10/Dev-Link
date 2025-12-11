// generate-flags-json.cjs
const fs = require("fs");
const countries = JSON.parse(fs.readFileSync("./countries.json", "utf-8")); // mledoze/countries

const flagsJSON = countries.map(c => ({
  name: c.name.common,
  flag: c.cca2 ? `https://flagcdn.com/w40/${c.cca2.toLowerCase()}.png` : null,
}))
.filter(c => c.flag !== null);

fs.writeFileSync("./countries-flags.json", JSON.stringify(flagsJSON, null, 2));
console.log("Created countries-flags.json with", flagsJSON.length, "entries");
