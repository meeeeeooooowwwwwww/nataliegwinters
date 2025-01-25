from flask import Flask, render_template_string
from scraper import scrape_headings

app = Flask(__name__)

@app.route('/')
def home():
    # Target URL to scrape
    url = 'https://warroom.org/?s=natalie+winters'  # Replace with the desired website
    headings = scrape_headings(url)

    # Read and render `news.html` from the root directory
    with open('news.html', 'r') as file:
        template = file.read()

    return render_template_string(template, headings=headings)

if __name__ == '__main__':
    app.run(debug=True)
