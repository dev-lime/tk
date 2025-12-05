Get-ChildItem -Path "." -Recurse -Force -Attributes "!Hidden" -Exclude ".*" | Where-Object {
	$_.FullName -notmatch "\\\.[^\\]*($|\\?)"
} | ForEach-Object {
	Write-Host "> $($_.FullName)" -ForegroundColor Green
    
	if ($_.PSIsContainer) {
		Write-Host "[Directory]"
	}
	else {
		try {
			$content = Get-Content -Path $_.FullName -Raw -Encoding UTF8 -ErrorAction Stop
			Write-Host $content
		}
		catch {
			try {
				$content = Get-Content -Path $_.FullName -Raw -Encoding Default -ErrorAction Stop
				Write-Host $content
			}
			catch {
				Write-Host "[Content cannot be read or contains binary data]"
			}
		}
	}
    
	Write-Host "`n"
}

Write-Host "Execution complete. Press 'y' to exit..." -ForegroundColor Cyan
do {
	$key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} while ($key.Character -notin @('y', 'Y'))
