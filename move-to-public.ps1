# List of files to move to public directory
$filesToMove = @(
    "about.html",
    "advertising.html",
    "articles.html",
    "biz.html",
    "business-template.html",
    "favicon.ico",
    "images.html",
    "index.html",
    "index1.html",
    "left-sidebar.html",
    "no-sidebar.html",
    "right-sidebar.html",
    "search-bar.html",
    "search-results.html",
    "videos.html",
    "warroom-videos.html",
    "wedding.html"
)

Write-Host "Starting file move process..."

# Create public directory if it doesn't exist
if (-not (Test-Path "public")) {
    Write-Host "Creating public directory..."
    New-Item -ItemType Directory -Path "public"
}

# Move each file
foreach ($file in $filesToMove) {
    if (Test-Path $file) {
        Write-Host "Moving $file to public directory..."
        Copy-Item -Path $file -Destination "public/$file" -Force
        Remove-Item -Path $file
    } else {
        Write-Host "Warning: $file not found"
    }
}

# Move directories
$dirsToMove = @(
    "assets",
    "images",
    "articles",
    "templates"
)

foreach ($dir in $dirsToMove) {
    if (Test-Path $dir) {
        Write-Host "Moving $dir directory to public..."
        if (-not (Test-Path "public/$dir")) {
            Copy-Item -Path $dir -Destination "public/$dir" -Recurse -Force
            Remove-Item -Path $dir -Recurse -Force
            Write-Host "Moved $dir successfully"
        } else {
            Write-Host "Warning: public/$dir already exists"
        }
    } else {
        Write-Host "Warning: $dir directory not found"
    }
}

Write-Host "Move completed!" 