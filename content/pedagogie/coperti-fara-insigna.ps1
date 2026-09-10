param([string]$GhidDir)
$ErrorActionPreference = "Stop"
$ppt = New-Object -ComObject PowerPoint.Application
foreach ($f in (Get-ChildItem $GhidDir -Filter *.pptx)) {
  $p = $ppt.Presentations.Open($f.FullName, $false, $false, $false)
  $s = $p.Slides(1); $scoase = 0
  # Pe copertă rămân doar formele cu text (titlul și subtitlul); insigna albastră
  # e o imagine plus pastila adăugată sub ea, deci pleacă amândouă.
  for ($i = $s.Shapes.Count; $i -ge 1; $i--) {
    $sp = $s.Shapes.Item($i)
    $areText = ($sp.HasTextFrame -eq -1) -and ($sp.TextFrame.HasText -eq -1)
    if (-not $areText) { $sp.Delete(); $scoase++ }
  }
  Write-Output ("{0}: {1} scoase, {2} ramase" -f $f.Name, $scoase, $s.Shapes.Count)
  $p.Save(); $p.Close()
}
$ppt.Quit()
