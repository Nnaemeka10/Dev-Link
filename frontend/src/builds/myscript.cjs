// generate-flags-json.cjs

const targetCountries = ['United States', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain'];
const fs = require("fs");
const countries = JSON.parse(fs.readFileSync("./countries.json", "utf-8")); // mledoze/countries

const flagsJSON = countries.map(c => ({
  name: c.name.common,
  flag: c.cca2 ? `https://flagcdn.com/w40/${c.cca2.toLowerCase()}.png` : null,
}))
.filter(c => targetCountries.includes(c.name));

fs.writeFileSync("./countries-language.json", JSON.stringify(flagsJSON, null, 2));
console.log("Created countries.json with", flagsJSON.length, "entries");
