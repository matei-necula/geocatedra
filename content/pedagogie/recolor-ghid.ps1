param([string[]]$Files, [string]$OutDir, [switch]$Badge)
$ErrorActionPreference = "Stop"
# COM dă culoarea ca BGR, nu RGB.
function ToBgr([string]$hex) {
  $r = [Convert]::ToInt32($hex.Substring(0,2),16); $g = [Convert]::ToInt32($hex.Substring(2,2),16); $b = [Convert]::ToInt32($hex.Substring(4,2),16)
  return ($b -shl 16) -bor ($g -shl 8) -bor $r
}
function Lum([int]$bgr) {
  $r = $bgr -band 0xFF; $g = ($bgr -shr 8) -band 0xFF; $b = ($bgr -shr 16) -band 0xFF
  return (0.2126*$r + 0.7152*$g + 0.0722*$b) / 255
}
$ppt = New-Object -ComObject PowerPoint.Application
foreach ($src in $Files) {
  $pres = $ppt.Presentations.Open($src, $false, $false, $false)
  $sw = $pres.PageSetup.SlideWidth; $sh = $pres.PageSetup.SlideHeight
  # Crema o luăm de la pagina a doua — restul ghidului o folosește deja.
  $cream = ToBgr "FFFCF5"
  if ($pres.Slides.Count -ge 2 -and $pres.Slides(2).FollowMasterBackground -eq 0) {
    $cream = $pres.Slides(2).Background.Fill.ForeColor.RGB
  }
  $s = $pres.Slides(1)
  # Scoate fundalul închis de pe toată pagina.
  $dropped = 0
  while ($true) {
    $bottom = $null
    foreach ($sp in $s.Shapes) { if ($sp.ZOrderPosition -eq 1) { $bottom = $sp; break } }
    if ($null -eq $bottom) { break }
    $full = ([math]::Abs($bottom.Width - $sw) -lt 2) -and ([math]::Abs($bottom.Height - $sh) -lt 2) -and
            ([math]::Abs($bottom.Left) -lt 2) -and ([math]::Abs($bottom.Top) -lt 2)
    if ($full) { $bottom.Delete(); $dropped++ } else { break }
  }
  $s.FollowMasterBackground = 0
  $s.Background.Fill.Solid()
  $s.Background.Fill.ForeColor.RGB = $cream
  # Textul deschis devine închis, altfel dispare pe crem.
  $fixed = 0
  foreach ($sp in $s.Shapes) {
    if ($sp.HasTextFrame -and $sp.TextFrame.HasText) {
      $tr = $sp.TextFrame.TextRange
      if ((Lum $tr.Font.Color.RGB) -gt 0.6) {
        $tr.Font.Color.RGB = if ($tr.Font.Size -ge 40) { ToBgr "1E3A8A" } else { ToBgr "334155" }
        $fixed++
      }
    }
  }
  # Insigna e o imagine făcută pentru fundal închis: îi punem o pastilă bleumarin dedesubt,
  # altfel textul ei bleu-deschis devine ilizibil pe crem.
  if ($Badge) {
    $pics = @(); foreach ($sp in $s.Shapes) { if ($sp.Type -eq 13) { $pics += $sp } }
    if ($pics.Count -gt 0) {
      $l = ($pics | Measure-Object -Property Left -Minimum).Minimum
      $t = ($pics | Measure-Object -Property Top -Minimum).Minimum
      $r = ($pics | ForEach-Object { $_.Left + $_.Width } | Measure-Object -Maximum).Maximum
      $b = ($pics | ForEach-Object { $_.Top + $_.Height } | Measure-Object -Maximum).Maximum
      $pill = $s.Shapes.AddShape(5, $l, $t, ($r - $l), ($b - $t))   # 5 = dreptunghi rotunjit
      $pill.Fill.Solid(); $pill.Fill.ForeColor.RGB = ToBgr "1E3A8A"
      $pill.Line.Visible = 0
      $pill.ZOrder(1)   # msoSendToBack — rămâne peste fundal, sub insignă
      foreach ($pic in $pics) { $pic.ZOrder(0) }  # msoBringToFront
    }
  }
  $name = [System.IO.Path]::GetFileName($src)
  $pres.SaveAs((Join-Path $OutDir $name))
  Write-Output "$name : fundal scos=$dropped, texte recolorate=$fixed"
  $pres.Close()
}
$ppt.Quit()
