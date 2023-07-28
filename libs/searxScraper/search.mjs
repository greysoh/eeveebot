import { parse } from "node-html-parser";
import axios from "axios";

//import { userAgent } from "./index.mjs";

// Headers sent by firefox
const firefoxHeaders = [
  {
    name: "Accept",
    value:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  },
  {
    name: "Accept-Encoding",
    value: "gzip, deflate, br",
  },
  {
    name: "Accept-Language",
    value: "en-US,en;q=0.5",
  },
  {
    name: "Cache-Control",
    value: "no-cache",
  },
  {
    name: "Pragma",
    value: "no-cache",
  },
  {
    name: "Sec-Fetch-Dest",
    value: "document",
  },
  {
    name: "Sec-Fetch-Mode",
    value: "navigate",
  },
  {
    name: "Sec-Fetch-Site",
    value: "same-origin",
  },
  {
    name: "TE",
    value: "trailers",
  },
  {
    name: "User-Agent",
    value: "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0"
  },
];

function stringFixer(str) {
  return str
    .trim()
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", ",")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", ">")
    .replaceAll("&rt;", "<")
    .replaceAll("&nbsp;", " ");
}

export async function search(instanceUrl, query) {
  const searchResults = [];
  const newHeaderList = {};

  for (const header of firefoxHeaders) {
    newHeaderList[header.name] = header.value;
  }

  const queryEncoded = encodeURIComponent(query);
  const url = `${instanceUrl}search?q=${queryEncoded}`;

  const { data } = await axios.get(url, {
    headers: newHeaderList,
  });

  const parsedHTML = parse(data);
  const results = parsedHTML.querySelectorAll(".result");

  for (const result of results) {
    const resultURLWrapper = result.getElementsByTagName("a")[0];
    const href = resultURLWrapper.rawAttributes.href;

    const metadata = result.querySelector(".content");
    searchResults.push({
      url: href,
      summary: stringFixer(metadata.innerText),
    });
  }

  return searchResults;
}
