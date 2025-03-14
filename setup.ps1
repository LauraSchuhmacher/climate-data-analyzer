# Check if Docker is installed and running
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker is installed. Checking if it's running..."
    if ((docker ps 2>&1) -match '^(?!error)') {
        # Build and start the container
        $dockerfilePath = "src/Dockerfile"
        $buildContext = "src"
        if (Test-Path $dockerfilePath) {
            Write-Host "Docker is running. Building and starting the container..."
            docker build -t climate_data_analyzer -f $dockerfilePath $buildContext
            docker run -d -p 5000:5000 --name lazy_lama climate_data_analyzer
        } else {
            Write-Host "Dockerfile not found in src/!"
        }
    } else {
        Write-Host "Docker is installed but not running. Please start Docker and try again."
    }
}

# Pause to read the console output
Write-Host "Press any key to exit..."
[System.Console]::ReadKey()
