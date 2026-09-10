param([string]$SrcDir, [string]$OutRoot, [string]$Prefix, [int]$Width = 1600)
$ErrorActionPreference = "Stop"
# Export() taie numele la primul punct și se încurcă în diacritice, așa că folosim
# foldere numerotate simplu și ținem legătura într-un index.
$ppt = New-Object -ComObject PowerPoint.Application
$i = 0
$index = @()
foreach ($f in (Get-ChildItem $SrcDir -Filter *.pptx | Sort-Object Name)) {
  $i++
  $dir = Join-Path $OutRoot ("{0}{1:D2}" -f $Prefix, $i)
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $pres = $ppt.Presentations.Open($f.FullName, $true, $false, $false)
  $h = [int]($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)
  $pres.Export($dir, "PNG", $Width, $h)
  $n = (Get-ChildItem $dir -Filter *.PNG).Count
  $index += [pscustomobject]@{ folder = (Split-Path $dir -Leaf); fisier = $f.Name; pagini = $n }
  Write-Output ("{0} <- {1} ({2} pagini)" -f (Split-Path $dir -Leaf), $f.Name, $n)
  $pres.Close()
}
$ppt.Quit()
$index | ConvertTo-Json | Out-File (Join-Path $OutRoot "$Prefix-index.json") -Encoding utf8
