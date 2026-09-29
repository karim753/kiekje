<?php

namespace Kiekje\Core;

/**
 * Slaat foto's op in backend/uploads/ en verwijdert ze weer.
 * Alleen echte afbeeldingen (jpeg, png, webp, gif) worden geaccepteerd, onder een willekeurige naam.
 */
class ImageStorage
{
    private const TYPES = ['jpeg' => 'jpg', 'png' => 'png', 'webp' => 'webp', 'gif' => 'gif'];
    private const MAX_BYTES = 8 * 1024 * 1024;

    private string $dir;

    public function __construct(?string $dir = null)
    {
        $this->dir = $dir ?? __DIR__ . '/../../uploads';
    }

    /**
     * Slaat een data-URL (data:image/...;base64,...) op en geeft het pad terug, bijv. "uploads/ab12....jpg".
     * @throws HttpException bij een ongeldige of te grote afbeelding
     */
    public function save(string $dataUrl): string
    {
        if (!preg_match('#^data:image/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$#', $dataUrl, $m)) {
            throw new HttpException('Ongeldige afbeelding.', 422);
        }
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || $bytes === '') {
            throw new HttpException('Ongeldige afbeelding.', 422);
        }
        if (strlen($bytes) > self::MAX_BYTES) {
            throw new HttpException('Afbeelding is te groot (max. 8 MB).', 422);
        }
        // controleer de inhoud zelf, niet alleen wat de browser zegt
        $info = @getimagesizefromstring($bytes);
        if (!$info || $info['mime'] !== 'image/' . $m[1]) {
            throw new HttpException('Bestand is geen geldige afbeelding.', 422);
        }

        if (!is_dir($this->dir) && !mkdir($this->dir, 0775, true)) {
            throw new HttpException('Uploadmap kon niet worden aangemaakt.', 500);
        }
        $name = bin2hex(random_bytes(16)) . '.' . self::TYPES[$m[1]];
        if (file_put_contents($this->dir . '/' . $name, $bytes) === false) {
            throw new HttpException('Afbeelding kon niet worden opgeslagen.', 500);
        }
        return 'uploads/' . $name;
    }

    /** Verwijdert een eerder opgeslagen bestand; andere waarden (oude data-URL's, null) worden genegeerd. */
    public function delete(?string $path): void
    {
        if ($path && preg_match('#^uploads/([a-f0-9]{32}\.(jpg|png|webp|gif))$#', $path, $m)) {
            @unlink($this->dir . '/' . $m[1]);
        }
    }
}
