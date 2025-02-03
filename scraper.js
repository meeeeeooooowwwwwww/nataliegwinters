const { chromium } = require('playwright'); // Import Playwright's chromium
const fs = require('fs');

async function scrapeArticles() {
  // Launch Playwright and open the WarRoom content feed page
  const browser = await chromium.launch({
    headless: true, // Set to true to run headless
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--single-process', '--disable-software-rasterizer']
  });
  
  const page = await browser.newPage();
  await page.goto('https://warroom.org/content-feed/', {
    waitUntil: 'networkidle0',
  });

  // Grab the links from the first 25 articles
  const articles = await page.evaluate(() => {
    const articleElements = document.querySelectorAll('.jeg_postblock_content .jeg_post_title a');
    const articleLinks = [];

    articleElements.forEach((element) => {
      articleLinks.push(element.href);
    });

    return articleLinks;
  });

  console.log('Fetched Articles:', articles);

  // Generate the HTML content
  const htmlContent = generateHTML(articles);

  // Save the HTML content to the news.html file
  fs.writeFileSync('news.html', htmlContent);

  // Close the browser
  await browser.close();
}

// Generate the HTML to insert the article links
function generateHTML(articles) {
  const articleLinksHTML = articles
    .map(
      (link) =>
        `<a href="${link}" target="_blank">${link}</a>\n<hr>\n`
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="description" content="Natalie G Winters Warroom news, from is a rising star in journalism and White House Press Correspondent known for her insightful analysis on media, politics, and business. Read more!">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="icon" type="image/icon" href="favicon.ico">
      <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="styles.css">
      <title>Natalie G Winters</title>
    </head>
    <body>
      <div class="container">
        <nav class="top-menu">
          <ul>
            <a href="https://shessoright.co" target="_blank" rel="noopener noreferrer">
              <img src="https://shessoright.co/cdn/shop/files/Screenshot_2023-11-09_at_11.53.34_AM-removebg-preview.png?v=1699559672&width=315" 
                alt="Natalie G Winters Shop" style="width:50px;height:auto;">
            </a>
            <li><a href="index.html">Home</a></li>
            <li><a href="nataliegwinters.html">@NatalieGWinters</a></li>
            <li><a href="https://shessoright.co/" target="_blank" rel="noopener noreferrer">Shop</a></li>
          </ul>
        </nav>

        <br>

        <h1>Latest News</h1>
        ${articleLinksHTML}

        <br>

        <div class="socials">
          <ul id="socials">
            <li><a href="https://www.instagram.com/nataliegwinters/" target="_blank" rel="noopener noreferrer"><img src="images/icons8-instagram-96.png" alt="Natalie G Winters Instagram" /></a></li>
            <li><a href="https://buymeacoffee.com/nataliegwinters" target="_blank" rel="noopener noreferrer"><img src="images/hot-beverage_2615.png" alt="Natalie G Winters Coffee" /></a></li>
            <li><a href="https://x.com/nataliegwinters" target="_blank" rel="noopener noreferrer"><img src="images/icons8-x-96.png" alt="Natalie G Winters X" /></a></li>
          </ul>
        </div>

        <div class="neon-container">
          <div class="neonText">Natalie G Winters</div>
        </div>

        <br>
        <div>
          <footer class="footer">
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="https://www.whitehouse.gov/news/" target="_blank" rel="noopener noreferrer">White House</a></li>
              <li><a href="https://warroom.org" target="_blank" rel="noopener noreferrer">War Room</a></li>
              <li><a href="https://shessoright.co/" target="_blank" rel="noopener noreferrer">She So Right</a></li>
            </ul>
          </footer>
        </div>

        <div class="footer3">
          <a href="https://github.com/meeeeeooooowwwwwww" target="_blank" rel="noopener noreferrer"><img src="https://avatars.githubusercontent.com/u/175055185?v=4" alt="Web Design By David Ruck" style="width:30px;height:auto;"></a>
        </div>

      </div>
    </body>
  </html>`;
}

// Run the scraper every time this script is executed
scrapeArticles();
