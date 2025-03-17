#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Download pre-sized New Zealand flag icons
curl -o public/favicon.ico "https://www.favicon.cc/favicon/993/731/favicon.ico" || exit 1
curl -o public/icon.png "https://flagcdn.com/32x24/nz.png" || exit 1
curl -o public/apple-icon.png "https://flagcdn.com/180x135/nz.png" || exit 1

echo "Favicon files have been downloaded to the public directory" 