# MySQL Database Setup Script for Task Manager
# This script helps you create the database

Write-Host "=== Task Manager Database Setup ===" -ForegroundColor Green
Write-Host ""

# Prompt for MySQL username
$username = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($username)) {
    $username = "root"
}

# Prompt for MySQL password
$password = Read-Host "Enter MySQL password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "Creating database 'taskmanager'..." -ForegroundColor Yellow

# Create database
$createDbCommand = "CREATE DATABASE IF NOT EXISTS taskmanager;"
$mysqlCommand = "mysql -u $username -p$passwordPlain -e `"$createDbCommand`""

try {
    Invoke-Expression $mysqlCommand
    Write-Host "✓ Database 'taskmanager' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update backend/.env file with:" -ForegroundColor White
    Write-Host "   DATABASE_URL=`"mysql://$username`:$passwordPlain@localhost:3306/taskmanager`"" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Run Prisma migrations:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   npm run prisma:generate" -ForegroundColor Yellow
    Write-Host "   npm run prisma:migrate" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Error creating database. Please check:" -ForegroundColor Red
    Write-Host "  - MySQL is running" -ForegroundColor White
    Write-Host "  - Username and password are correct" -ForegroundColor White
    Write-Host "  - MySQL is in your PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "You can also create the database manually:" -ForegroundColor Yellow
    Write-Host "  mysql -u $username -p" -ForegroundColor Cyan
    Write-Host "  CREATE DATABASE taskmanager;" -ForegroundColor Cyan
}

