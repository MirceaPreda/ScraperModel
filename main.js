const Apify = require('apify');

// Apify.utils contains various utilities, e.g. for logging.
// Here we turn off the logging of unimportant messages.
const { log } = Apify.utils;
log.setLevel(log.LEVELS.WARNING);

// Apify.main() function wraps the crawler logic (it is optional).
Apify.main(async () => {
    // Create and initialize an instance of the RequestList class that contains
    // a list of URLs to crawl. Here we use just a few hard-coded URLs.
    const requestList = new Apify.RequestList({
        sources: [
            { url: 'https://www.fastenal.com/products/details/0833003' },
            { url: 'https://www.argos.co.uk/product/9805237' },
            { url: 'https://www.argos.co.uk/product/9803064' },
            { url: 'https://www.argos.co.uk/product/4996873' },
            { url: 'https://www.argos.co.uk/browse/technology/household-batteries-and-battery-chargers/batteries/c:30218/' },
        ],
    });
    await requestList.initialize();

    // Create an instance of the CheerioCrawler class - a crawler
    // that automatically loads the URLs and parses their HTML using the cheerio library.
    const crawler = new Apify.CheerioCrawler({
        // Let the crawler fetch URLs from our list.
        requestList,

        // The crawler downloads and processes the web pages in parallel, with a concurrency
        // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
        // Here we define some hard limits for the concurrency.
        minConcurrency: 10,
        maxConcurrency: 50,

        // On error, retry each page at most once.
        maxRequestRetries: 1,

        // Increase the timeout for processing of each page.
        handlePageTimeoutSecs: 60,

        // This function will be called for each URL to crawl.
        // It accepts a single parameter, which is an object with the following fields:
        // - request: an instance of the Request class with information such as URL and HTTP method
        // - html: contains raw HTML of the page
        // - $: the cheerio object containing parsed HTML
        handlePageFunction: async ({ request, $ }) => {
            console.log(`Processing ${request.url}...`);

            // Extract data from the page using cheerio.
            // individual extraction of text / information (non-dynamic)
            const nameOfProduct = $('title').text().trim();

            const price = [];
            $('h2').each((index, el) => {
                price.push({
                    text: $(el).text(),
                });
            });

            const sale = $('div[class^=padding--bottom-5]').text().trim();
            const availabilityFastenal = $('div[class^=store__availability]').text().trim();
            const availabilityArgos = $('div[class^=fulfilment-box]').text().trim();


            // Model made to see within the same constant
            // stores text based on the classes used
            const DataScraped = [];
            // from HTML "body" get the following information and store it in DataScraped
            $('body').each((index, el) => {
                DataScraped.push({
                    nameProduct: $('title').text().trim(),
                    price: $('h2').text().trim(),
                    priceOfObjTwo: $('.padding--bottom-5').text().trim(),
                    availabilityOfFastenal: $('div[class^=store__availability]').text().trim(),
                    availabilityOfArgos: $('div[class^=fulfilment-box]').text().trim(),
                });
            });

            // Store the results to the default dataset. In local configuration,
            // the data will be stored as JSON files in ./apify_storage/datasets/default
            await Apify.pushData({
                url: request.url,
                //nameOfProduct,
                //price,
                //sale,
                //availabilityFastenal,
                //availabilityArgos,
                DataScraped,
            });
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed twice.`);
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});
