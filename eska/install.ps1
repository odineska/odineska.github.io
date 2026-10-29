$ErrorActionPreference = "Stop"

$installer = Invoke-RestMethod `
    -Uri "https://github.com/odineska/eska/releases/latest/download/eska-installer.ps1"

Invoke-Expression $installer
