# Check if Docker is installed and running
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker is installed. Checking if it's running..."
    if((docker ps 2>&1) -match '^(?!error)'){
        # Build and start the container
        if (Test-Path "docker-compose.yml") {
            Write-Host "Docker is running. Starting container..."
            docker-compose up --build
         } else {
            Write-Host "docker-compose.yml not found!"
          }
    } else {
        Write-Host "Docker is installed but not running. Please start Docker and try again."
    }
}

# Pause to read the console output
Write-Host "Press any key to exit..."
[System.Console]::ReadKey()
