const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");
const { templates, plain, quantity } = require("./parse.cjs");
const root = path.resolve(__dirname, "../..");
const base = "https://grounded.wiki.gg";
const sourceUrl = (title) =>
  base +
  "/wiki/" +
  encodeURIComponent(title.replaceAll(" ", "_")).replaceAll("%2F", "/");
const name = (text) =>
  plain(text).replace(/#.*$/, "").replace(/\s+/g, " ").trim();
const id = (text) =>
  "g2-" + crypto.createHash("sha256").update(text).digest("hex").slice(0, 20);
function recipes(text) {
  return templates(text)
    .filter((t) => t.name === "recipe:item/g2")
    .flatMap(({ fields: f }) => {
      const inputs = [];
      for (let i = 1; i <= 8; i++)
        if (f["material" + i])
          inputs.push({
            name: name(f["material" + i]),
            quantity: quantity(f["material" + i + "quantity"]),
          });
      const output = name(f.item),
        amount =
          f.amount === undefined
            ? 1
            : Number(f.amount.match(/^\(?x(\d+)\)?$/i)?.[1]);
      if (
        !output ||
        !Number.isSafeInteger(amount) ||
        amount < 1 ||
        !inputs.length ||
        inputs.some((i) => !i.name || !i.quantity)
      )
        return [];
      const recipe = {
        station: name(f.station),
        notes: plain(f.notes),
        inputs: inputs.map((i) => ({ ...i, itemId: id(i.name) })),
        outputs: [{ name: output, quantity: amount, itemId: id(output) }],
        sourceUrl: sourceUrl("Template:Recipe/G2"),
      };
      return [
        {
          id:
            "g2-recipe-" +
            crypto
              .createHash("sha256")
              .update(JSON.stringify(recipe))
              .digest("hex")
              .slice(0, 20),
          ...recipe,
        },
      ];
    });
}
async function run() {
  const provenance = new Map();
  await fs.mkdir(path.join(root, ".catalog-cache"), { recursive: true });
  async function api(params) {
    const url =
      base + "/api.php?" + new URLSearchParams({ ...params, format: "json" });
    const file = path.join(
      root,
      ".catalog-cache",
      crypto.createHash("sha256").update(url).digest("hex") + ".json",
    );
    let record;
    try {
      record = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {}
    if (!record) {
      await new Promise((r) => setTimeout(r, 200));
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "BancyCraft/0.5.0 (offline catalog importer; https://github.com/d-bergman/bancycraft)",
        },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok)
        throw Error("Grounded wiki request failed: " + response.status);
      record = {
        url,
        fetchedAt: new Date().toISOString(),
        text: await response.text(),
      };
      await fs.writeFile(file, JSON.stringify(record));
    }
    provenance.set(url, {
      url,
      fetchedAt: record.fetchedAt,
      sha256: crypto.createHash("sha256").update(record.text).digest("hex"),
    });
    const result = JSON.parse(record.text);
    if (result.error) throw Error(result.error.info);
    return result;
  }
  async function pages(titles) {
    const result = [];
    for (let i = 0; i < titles.length; i += 50) {
      const data = await api({
        action: "query",
        titles: titles.slice(i, i + 50).join("|"),
        redirects: "1",
        prop: "revisions",
        rvprop: "ids|timestamp|content",
        rvslots: "main",
      });
      result.push(...Object.values(data.query.pages));
    }
    return result;
  }
  const rights = (
    await api({ action: "query", meta: "siteinfo", siprop: "rightsinfo" })
  ).query.rightsinfo;
  const definitions = await pages([
    "Template:Recipe/G2",
    "Template:Armor Set/Grounded 2/Autofill",
  ]);
  const recipePage = definitions.find((p) => p.title === "Template:Recipe/G2");
  const recipeRows = [
    ...new Map(
      recipes(recipePage.revisions[0].slots.main["*"]).map((r) => [r.id, r]),
    ).values(),
  ];
  const items = new Map();
  function add(n, fields = {}) {
    if (!n) return;
    if (!items.has(n))
      items.set(n, {
        id: id(n),
        name: n,
        category: "Item",
        description: "",
        acquisition: "",
        sourceUrl: sourceUrl("Template:Recipe/G2"),
        revision: recipePage.revisions[0].revid,
        updatedAt: recipePage.revisions[0].timestamp,
      });
    Object.assign(items.get(n), fields);
  }
  recipeRows.forEach((r) =>
    [...r.inputs, ...r.outputs].forEach((i) => add(i.name)),
  );
  const armorPage = definitions.find(
    (p) => p.title === "Template:Armor Set/Grounded 2/Autofill",
  );
  const sets = templates(armorPage.revisions[0].slots.main["*"])
    .filter(
      (t) => t.name.startsWith("armor set/grounded 2") && t.fields.armorset,
    )
    .map((t) => {
      const pieces = ["headpiece", "upperpiece", "lowerpiece"]
        .map((k) => name(t.fields[k] || ""))
        .filter(Boolean);
      pieces.forEach((piece, index) =>
        add(piece, {
          category: ["Head Armor", "Body Armor", "Leg Armor"][index],
          sourceUrl: sourceUrl(name(t.fields.armorset)),
          revision: armorPage.revisions[0].revid,
          updatedAt: armorPage.revisions[0].timestamp,
        }),
      );
      return {
        name: name(t.fields.armorset),
        ids: pieces.map(id),
        alternatives: {},
        kind: "Armor",
        sourceUrl: sourceUrl(name(t.fields.armorset)),
      };
    })
    .filter((s) => s.ids.length);
  const transcluded = new Map();
  for (const kind of [
    "Resources",
    "Tools",
    "Armor",
    "Consumables",
    "Smoothies",
    "Trinkets",
    "Base Structures",
  ]) {
    let continuation = {};
    do {
      const data = await api({
        action: "query",
        list: "embeddedin",
        eititle: "Template:Infobox/" + kind + "/G2",
        einamespace: "0",
        eilimit: "500",
        ...continuation,
      });
      data.query.embeddedin.forEach((p) => transcluded.set(p.pageid, p.title));
      continuation = data.continue;
    } while (continuation);
  }
  const titles = [...new Set([...items.keys(), ...transcluded.values()])];
  const details = await pages(titles);
  const imageNames = new Map();
  for (const p of details) {
    const text = p.revisions?.[0]?.slots.main["*"] || "";
    const box = templates(text).find((t) =>
      /^infobox\/(resources|tools|armor|consumables|smoothies|trinkets|base structures)\/g2$/.test(
        t.name,
      ),
    );
    if (!box) continue; // Original-game-only pages never provide sequel data.
    const f = box.fields,
      n = name(p.title.replace(/ \(Grounded 2\)$/, ""));
    add(n, {
      category: name(f.category || f.type || box.name.split("/")[1]),
      description: plain(f.description),
      acquisition: f.location ? "Location/source: " + plain(f.location) : "",
      sourceUrl: sourceUrl(p.title) + "#_Grounded_2_-0",
      revision: p.revisions[0].revid,
      updatedAt: p.revisions[0].timestamp,
    });
    const image = (f.image || "").replace(/^File:/i, "").trim();
    if (image && !/[{}|]/.test(image)) imageNames.set(n, image);
  }
  const catalog = {
    schemaVersion: 1,
    game: "grounded2",
    importedAt: new Date().toISOString(),
    source: {
      name: "Grounded Wiki contributors",
      url: base,
      license: rights.text,
      licenseUrl: rights.url,
    },
    coverage:
      "Explicit Grounded 2 Recipe/G2 item recipes and Grounded 2 infoboxes; armor bundles from the sequel-only armor template. Original-game-only data, repair costs, dynamic drop quantities and unsupported smoothie recipes are excluded. Missing acquisition information is marked unknown.",
    items: [...items.values()].sort((a, b) => a.name.localeCompare(b.name)),
    recipes: recipeRows,
  };
  await fs.writeFile(
    path.join(root, "src/catalog/data/grounded2.json"),
    JSON.stringify(catalog, null, 2) + "\n",
  );
  const gearsets = JSON.parse(
    await fs.readFile(
      path.join(root, "src/catalog/data/gearsets.json"),
      "utf8",
    ),
  );
  gearsets.grounded2 = [...new Map(sets.map((s) => [s.name, s])).values()];
  await fs.writeFile(
    path.join(root, "src/catalog/data/gearsets.json"),
    JSON.stringify(gearsets, null, 2) + "\n",
  );
  console.log(
    `Grounded 2: ${catalog.items.length} items, ${recipeRows.length} recipes, ${gearsets.grounded2.length} armor sets.`,
  );
  const filenames = [
    ...new Set(
      catalog.items
        .flatMap((i) => [
          imageNames.get(i.name),
          i.name + "G2.png",
          i.name + ".png",
        ])
        .filter(Boolean),
    ),
  ];
  const imageUrls = new Map();
  for (let i = 0; i < filenames.length; i += 50) {
    const data = await api({
      action: "query",
      titles: filenames
        .slice(i, i + 50)
        .map((n) => "File:" + n)
        .join("|"),
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "96",
      redirects: "1",
    });
    for (const p of Object.values(data.query.pages)) {
      const info = p.imageinfo?.[0];
      if (info)
        imageUrls.set(
          p.title.replace(/^File:/, "").replaceAll("_", " "),
          info.thumburl || info.url,
        );
    }
    for (const r of data.query.redirects || [])
      if (imageUrls.has(r.to.replace(/^File:/, "").replaceAll("_", " ")))
        imageUrls.set(
          r.from.replace(/^File:/, "").replaceAll("_", " "),
          imageUrls.get(r.to.replace(/^File:/, "").replaceAll("_", " ")),
        );
  }
  const icons = JSON.parse(
    await fs.readFile(path.join(root, "src/catalog/data/icons.json"), "utf8"),
  );
  icons.grounded2 = {};
  const failures = [];
  let cursor = 0;
  async function worker() {
    while (cursor < catalog.items.length) {
      const item = catalog.items[cursor++];
      const url = [
        imageNames.get(item.name),
        item.name + "G2.png",
        item.name + ".png",
      ]
        .map((n) => imageUrls.get(n))
        .find(Boolean);
      if (!url) continue;
      const filename =
        crypto
          .createHash("sha256")
          .update("grounded2:" + item.id)
          .digest("hex")
          .slice(0, 20) + ".webp";
      const file = path.join(root, "public/assets/items", filename);
      try {
        try {
          await fs.access(file);
        } catch {
          const response = await fetch(url, {
            headers: { "User-Agent": "BancyCraft/0.5.0" },
            signal: AbortSignal.timeout(45000),
          });
          if (!response.ok) throw Error(String(response.status));
          await sharp(Buffer.from(await response.arrayBuffer()))
            .resize(64, 64, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toFile(file);
          await new Promise((r) => setTimeout(r, 150));
        }
        icons.grounded2[item.id] = "./assets/items/" + filename;
      } catch (e) {
        failures.push({ name: item.name, reason: e.message });
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  await fs.writeFile(
    path.join(root, "src/catalog/data/icons.json"),
    JSON.stringify(icons, null, 2) + "\n",
  );
  await fs.writeFile(
    path.join(root, ".catalog-cache/grounded2-provenance.json"),
    JSON.stringify({ sources: [...provenance.values()], failures }, null, 2),
  );
  console.log(
    `Grounded 2: ${Object.keys(icons.grounded2).length} local icons; ${failures.length} download failures.`,
  );
}
module.exports = { recipes, id };
if (require.main === module)
  run().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
