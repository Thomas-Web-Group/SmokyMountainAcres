const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("assets");

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