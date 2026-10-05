const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");

// Reads width/height from a WebP file header (VP8, VP8L, VP8X).
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const type = b.toString("ascii", 12, 16);
  if (type === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (type === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (type === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("admin/**");
  eleventyConfig.addWatchTarget("content");

  // Adds width/height and lazy loading to <img> tags; the first few images stay eager.
  eleventyConfig.addTransform("imageAttributes", function(content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    let count = 0;
    return content.replace(/<img\b[^>]*>/gi, (tag) => {
      count += 1;
      let out = tag;
      const src = /\ssrc="(\/assets\/[^"]+\.webp)"/i.exec(tag);
      if (src && !/\swidth=/i.test(tag) && !/\sheight=/i.test(tag)) {
        try {
          const size = webpSize(path.join(__dirname, decodeURI(src[1])));
          if (size) out = out.replace(/<img\b/i, `<img width="${size.width}" height="${size.height}"`);
        } catch (e) { /* missing file: leave tag unchanged */ }
      }
      if (count > 3 && !/\sloading=/i.test(out)) out = out.replace(/<img\b/i, '<img loading="lazy" decoding="async"');
      return out;
    });
  });

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime
      .fromJSDate(dateObj, { zone: "utc" })
      .toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter("interleavePostImages", (html, images = []) => {
    const inlineImages = images.slice(1);

    if (!inlineImages.length || !html) {
      return html;
    }

    const paragraphCount = (html.match(/<\/p>/gi) || []).length;
    let paragraphIndex = 0;
    let imageIndex = 0;

    if (!paragraphCount) {
      return `${html}${inlineImages.map((postImage) => `\n<figure class="post-inline-image"><img src="${postImage.src}" alt="${postImage.alt}" class="img-fluid"></figure>`).join("")}`;
    }

    return html.replace(/<\/p>/gi, (closingParagraph) => {
      paragraphIndex += 1;

      if (imageIndex >= inlineImages.length) {
        return closingParagraph;
      }

      const targetParagraph = Math.ceil(
        ((imageIndex + 1) * paragraphCount) / (inlineImages.length + 1)
      );

      if (paragraphIndex < targetParagraph) {
        return closingParagraph;
      }

      const postImage = inlineImages[imageIndex];
      imageIndex += 1;

      return `${closingParagraph}\n<figure class="post-inline-image"><img src="${postImage.src}" alt="${postImage.alt}" class="img-fluid"></figure>`;
    });
  });

};