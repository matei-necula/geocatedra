param([string[]]$Files, [string]$Bg, [string]$OutDir, [switch]$WarmAccents)
$ErrorActionPreference = "Stop"

# COM ține culorile ca BGR. Rotim doar nuanțele reci spre teracotă, păstrând
# saturația și luminozitatea — așa contrastul textului rămâne cât era.
$HueTinta = 16.0; $HueMin = 165.0; $HueMax = 300.0

function BgrToHsl([int]$bgr) {
  $r = ($bgr -band 0xFF)/255; $g = (($bgr -shr 8) -band 0xFF)/255; $b = (($bgr -shr 16) -band 0xFF)/255
  $max = [math]::Max($r,[math]::Max($g,$b)); $min = [math]::Min($r,[math]::Min($g,$b))
  $l = ($max+$min)/2; $d = $max-$min
  if ($d -eq 0) { return @(0.0, 0.0, $l) }
  $s = if ($l -gt 0.5) { $d/(2-$max-$min) } else { $d/($max+$min) }
  $h = switch ($max) {
    $r { (($g-$b)/$d) % 6 }
    $g { ($b-$r)/$d + 2 }
    default { ($r-$g)/$d + 4 }
  }
  $h = $h*60; if ($h -lt 0) { $h += 360 }
  return @($h, $s, $l)
}
function HslToBgr([double]$h, [double]$s, [double]$l) {
  $c = (1 - [math]::Abs(2*$l - 1)) * $s
  $x = $c * (1 - [math]::Abs((($h/60) % 2) - 1)); $m = $l - $c/2
  $rgb = switch ([math]::Floor($h/60)) {
    0 { @($c,$x,0) } 1 { @($x,$c,0) } 2 { @(0,$c,$x) } 3 { @(0,$x,$c) } 4 { @($x,0,$c) } default { @($c,0,$x) }
  }
  $r = [int][math]::Round(($rgb[0]+$m)*255); $g = [int][math]::Round(($rgb[1]+$m)*255); $b = [int][math]::Round(($rgb[2]+$m)*255)
  return ($b -shl 16) -bor ($g -shl 8) -bor $r
}
function Incalzeste([int]$bgr) {
  $hsl = BgrToHsl $bgr
  if ($hsl[1] -le 0.05) { return $bgr }                      # gri curat: îl lăsăm
  if ($hsl[0] -lt $HueMin -or $hsl[0] -gt $HueMax) { return $bgr }  # deja cald
  return HslToBgr $HueTinta $hsl[1] $hsl[2]
}

$script:atinse = 0
function IncalzesteForma($sp) {
  if ($sp.Type -eq 6) { foreach ($it in $sp.GroupItems) { IncalzesteForma $it }; return }
  try { if ($sp.Fill.Visible -eq -1) {
    $n = Incalzeste $sp.Fill.ForeColor.RGB
    if ($n -ne $sp.Fill.ForeColor.RGB) { $sp.Fill.ForeColor.RGB = $n; $script:atinse++ }
  } } catch {}
  try { if ($sp.Line.Visible -eq -1) {
    $n = Incalzeste $sp.Line.ForeColor.RGB
    if ($n -ne $sp.Line.ForeColor.RGB) { $sp.Line.ForeColor.RGB = $n; $script:atinse++ }
  } } catch {}
  # Fragmentele se iau cu $tr.Runs($i), nu prin .Item() — altfel apelul pică în tăcere.
  if ($sp.HasTextFrame -eq -1 -and $sp.TextFrame.HasText -eq -1) {
    $tr = $sp.TextFrame.TextRange
    $nr = 0; try { $nr = $tr.Runs().Count } catch { $nr = 0 }
    if ($nr -gt 0) {
      for ($i = 1; $i -le $nr; $i++) {
        try {
          $run = $tr.Runs($i)
          $n = Incalzeste $run.Font.Color.RGB
          if ($n -ne $run.Font.Color.RGB) { $run.Font.Color.RGB = $n; $script:atinse++ }
        } catch {}
      }
    } else {
      try {
        $n = Incalzeste $tr.Font.Color.RGB
        if ($n -ne $tr.Font.Color.RGB) { $tr.Font.Color.RGB = $n; $script:atinse++ }
      } catch {}
    }
  }
}

$ppt = New-Object -ComObject PowerPoint.Application
foreach ($src in $Files) {
  $pres = $ppt.Presentations.Open($src, $false, $false, $false)
  $sw = $pres.PageSetup.SlideWidth; $sh = $pres.PageSetup.SlideHeight
  $script:atinse = 0; $scoase = 0
  foreach ($slide in $pres.Slides) {
    while ($true) {
      $bottom = $null
      foreach ($sp in $slide.Shapes) { if ($sp.ZOrderPosition -eq 1) { $bottom = $sp; break } }
      if ($null -eq $bottom) { break }
      $full = ([math]::Abs($bottom.Width - $sw) -lt 2) -and ([math]::Abs($bottom.Height - $sh) -lt 2) -and
              ([math]::Abs($bottom.Left) -lt 2) -and ([math]::Abs($bottom.Top) -lt 2)
      if ($full) { $bottom.Delete(); $scoase++ } else { break }
    }
    if ($WarmAccents) { foreach ($sp in $slide.Shapes) { IncalzesteForma $sp } }
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.UserPicture($Bg)
  }
  $name = [System.IO.Path]::GetFileName($src)
  $pres.SaveAs((Join-Path $OutDir $name))
  Write-Output "$name : $($pres.Slides.Count) slide-uri, fundaluri scoase=$scoase, culori încalzite=$($script:atinse)"
  $pres.Close()
}
$ppt.Quit()
