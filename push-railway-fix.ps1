Set-Location "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

$logFile = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia\git-push-result.txt"

$output = @()
$output += "=== Git Push Railway Fix ==="
$output += "Data: $(Get-Date)"
$output += ""

# Git add
$add = git add railway.toml nixpacks.toml package.json 2>&1
$output += "git add: $add"

# Git commit
$commit = git commit -m "fix: corrige build Railway - devDeps + build completo" 2>&1
$output += "git commit: $commit"

# Git push
$push = git push origin HEAD 2>&1
$output += "git push: $push"

$output += ""
$output += "=== CONCLUIDO ==="

$output | Out-File -FilePath $logFile -Encoding UTF8

# Show result
$result = $output -join "`n"
[System.Windows.Forms.MessageBox]::Show($result, "Railway Fix Push")
