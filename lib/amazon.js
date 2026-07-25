"use strict";
const TAG = process.env.AMAZON_TAG || "shoyebkhan192-20";

// A valid affiliate link whether or not we know the ASIN.
const buildUrl = (asin, q) => asin
  ? `https://www.amazon.com/dp/${asin}?tag=${TAG}`
  : `https://www.amazon.com/s?k=${encodeURIComponent(q || "product")}&tag=${TAG}`;

// PA-API is OPTIONAL. If the SDK or keys are missing, lookup() simply returns null
// and the admin UI falls back to manual entry. Nothing crashes.
let paapi = null;
const PAAPI_TAG = process.env.PAAPI_PARTNER_TAG || TAG;
try {
  if (process.env.PAAPI_ACCESS_KEY && process.env.PAAPI_SECRET_KEY) {
    const SDK = require("paapi5-nodejs-sdk");
    paapi = new SDK.DefaultApi({
      accessKey: process.env.PAAPI_ACCESS_KEY,
      secretKey: process.env.PAAPI_SECRET_KEY,
      host: "webservices.amazon.com",
      region: "us-east-1",
    });
    console.log("[amazon] PA-API enabled");
  } else {
    console.log("[amazon] PA-API keys absent → manual entry mode");
  }
} catch (e) { console.warn("[amazon] PA-API SDK not installed → manual entry mode"); }

const g = (o, ...k) => k.reduce((a, p) => (a && a[p] != null ? a[p] : null), o);

async function lookup(asin) {
  if (!paapi || !asin) return null;
  try {
    const res = await paapi.getItems({
      ItemIds: [asin], PartnerTag: PAAPI_TAG, PartnerType: "Associates",
      Resources: ["ItemInfo.Title", "ItemInfo.ByLineInfo.Brand", "Offers.Listings.Price",
                  "Images.Primary.Large", "CustomerReviews.StarRating", "CustomerReviews.Count"],
    });
    const it = g(res, "ItemsResult", "Items", 0);
    if (!it) return null;
    return {
      asin,
      title:   g(it, "ItemInfo", "Title", "DisplayValue"),
      brand:   g(it, "ItemInfo", "ByLineInfo", "Brand", "DisplayValue"),
      price:   g(it, "Offers", "Listings", 0, "Price", "Amount"),
      currency:g(it, "Offers", "Listings", 0, "Price", "Currency"),
      image:   g(it, "Images", "Primary", "Large", "URL"),
      rating:  g(it, "CustomerReviews", "StarRating", "Value"),
      reviews: g(it, "CustomerReviews", "Count"),
    };
  } catch (e) { console.warn("[amazon] lookup failed:", e.message); return null; }
}

module.exports = { TAG, buildUrl, lookup, available: () => !!paapi };
