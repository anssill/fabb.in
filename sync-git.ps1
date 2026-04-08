$interval = 300 # 5 minutes in seconds

while ($true) {
    Try {
        Write-Output "Starting sync at $(Get-Date)"
        git add .
        # Only commit if there are changes
        if (git status --porcelain) {
            git commit -m "Auto-sync: $(Get-Date)"
            git push origin main
            Write-Output "Successfully pushed changes."
        } else {
            Write-Output "No changes to sync."
        }
    } Catch {
        Write-Error "Sync failed: $_"
    }
    Start-Sleep -Seconds $interval
}
