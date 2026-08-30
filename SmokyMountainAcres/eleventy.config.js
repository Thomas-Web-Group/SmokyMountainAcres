const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime
      .fromJSDate(dateObj, { zone: "utc" })
      .toLocaleString(DateTime.DATE_MED);
  });

};