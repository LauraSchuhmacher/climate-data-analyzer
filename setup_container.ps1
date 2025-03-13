# Check if Docker is installed
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker is installed. Checking if it's running..."
    if((docker ps 2>&1) -match '^(?!error)'){
        Write-Host "Docker is running. Starting container..."
        docker run -p 5000:5000 ghcr.io/lauraschuhmacher/climate-data-analyzer:latest
    } else {
        Write-Host "Docker is installed but not running. Please start Docker and try again."
    }
}
# If Docker is not installed, check for Podman
elseif (Get-Command podman -ErrorAction SilentlyContinue) {
    Write-Host "Podman is installed. Checking if it's running..."
    if ((podman ps 2>&1) -match '^(?!error)') {
        Write-Host "Podman is running. Starting container..."
        podman run -p 5000:5000 ghcr.io/lauraschuhmacher/climate-data-analyzer:latest
    } else {
        Write-Host "Podman is installed but not running. Please start Podman and try again."
    }
}
# If neither Docker nor Podman is installed, output a message
else {
    Write-Host "Neither Docker nor Podman is installed. Please install one of them to run the container."
}

# Pause to read the console output
Write-Host "Press any key to exit..."
[System.Console]::ReadKey()
