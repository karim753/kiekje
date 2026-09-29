# Tekent eenvoudige "nieuwskaart"-afbeeldingen (JPEG) voor testdata, zonder PHP-GD.
# Gebruik: powershell -ExecutionPolicy Bypass -File tools\render_cards.ps1 <spec.json> <uitvoermap>
# spec.json: lijst van { file, kind: "post"|"story"|"avatar", bg1, bg2, tag, title, sub, handle }
param([Parameter(Mandatory)][string]$Spec, [Parameter(Mandatory)][string]$OutDir)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $OutDir | Out-Null

$cards = Get-Content $Spec -Raw -Encoding UTF8 | ConvertFrom-Json
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 88L

function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

foreach ($c in $cards) {
	$w = 1080; $h = if ($c.kind -eq 'story') { 1920 } elseif ($c.kind -eq 'avatar') { 400 } else { 1080 }
	if ($c.kind -eq 'avatar') { $w = 400 }
	$bmp = New-Object System.Drawing.Bitmap $w, $h
	$g = [System.Drawing.Graphics]::FromImage($bmp)
	$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'

	# achtergrond: diagonaal verloop
	$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
	$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (Color $c.bg1), (Color $c.bg2), 45
	$g.FillRectangle($bg, $rect)

	# decoratie: lijnen van een voetbalveld (middencirkel + middenlijn), half doorzichtig
	$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(40, 255, 255, 255)), ([Math]::Max(4, $w / 180))
	$r = $w * 0.32
	$g.DrawEllipse($pen, $w / 2 - $r, $h / 2 - $r, 2 * $r, 2 * $r)
	$g.DrawLine($pen, 0, $h / 2, $w, $h / 2)
	$g.DrawRectangle($pen, $w * 0.04, $h * 0.04, $w * 0.92, $h * 0.92)

	$white = [System.Drawing.Brushes]::White
	$center = New-Object System.Drawing.StringFormat
	$center.Alignment = 'Center'; $center.LineAlignment = 'Center'

	if ($c.kind -eq 'avatar') {
		# avatar: initialen groot in het midden
		$f = New-Object System.Drawing.Font 'Impact', 150
		$g.DrawString($c.title, $f, $white, (New-Object System.Drawing.RectangleF 0, 0, $w, $h), $center)
	} else {
		$pad = $w * 0.09
		$top = if ($c.kind -eq 'story') { $h * 0.30 } else { $h * 0.16 }
		# label (bijv. BREAKING / TRANSFER) als pilletje
		$tf = New-Object System.Drawing.Font 'Arial', 30, ([System.Drawing.FontStyle]::Bold)
		$ts = $g.MeasureString($c.tag, $tf)
		$pill = New-Object System.Drawing.SolidBrush (Color '#FFD60A')
		$g.FillRectangle($pill, $pad, $top, $ts.Width + 36, $ts.Height + 18)
		$g.DrawString($c.tag, $tf, [System.Drawing.Brushes]::Black, $pad + 18, $top + 9)
		# kop
		$hf = New-Object System.Drawing.Font 'Impact', 92
		$box = New-Object System.Drawing.RectangleF $pad, ($top + $ts.Height + 60), ($w - 2 * $pad), ($h * 0.5)
		$g.DrawString($c.title.ToUpper(), $hf, $white, $box)
		$hs = $g.MeasureString($c.title.ToUpper(), $hf, [int]($w - 2 * $pad))
		# onderkop
		$sf = New-Object System.Drawing.Font 'Segoe UI', 34
		$sbox = New-Object System.Drawing.RectangleF $pad, ($box.Y + $hs.Height + 30), ($w - 2 * $pad), ($h * 0.3)
		$g.DrawString($c.sub, $sf, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(225, 255, 255, 255))), $sbox)
		# accountnaam onderin
		$af = New-Object System.Drawing.Font 'Segoe UI', 28, ([System.Drawing.FontStyle]::Bold)
		$g.DrawString('@' + $c.handle, $af, $white, $pad, $h - $h * 0.04 - 80)
	}

	$bmp.Save((Join-Path $OutDir $c.file), $jpeg, $params)
	$g.Dispose(); $bmp.Dispose()
}
Write-Output "$($cards.Count) afbeeldingen getekend in $OutDir"
