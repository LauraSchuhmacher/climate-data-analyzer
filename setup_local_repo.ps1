# Define repository URL and target directory
$repoUrl = "https://github.com/LauraSchuhmacher/climate-data-analyzer.git"
$targetDir = "$PWD\climate-data-analyzer"

# Clone the repository
if (Test-Path $targetDir) {
    Write-Host "Repository already exists. Pulling latest changes..."
    Set-Location $targetDir
    git pull
} else {
    Write-Host "Cloning repository..."
    git clone $repoUrl $targetDir
    Set-Location $targetDir
}

# Install dependencies
if (Test-Path "requirements.txt") {
    Write-Host "Installing dependencies..."
    python -m pip install -r requirements.txt
} else {
    Write-Host "requirements.txt not found!"
}

# Build and start the container
if (Test-Path "docker-compose.yml") {
    Write-Host "Building and starting the container..."
    docker-compose up --build
} else {
    Write-Host "docker-compose.yml not found!"
}
