<?php

use Kiekje\Core\HttpException;
use Kiekje\Core\ImageStorage;
use PHPUnit\Framework\TestCase;

final class ImageStorageTest extends TestCase
{
    // 1x1 rode PNG
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    private string $dir;
    private ImageStorage $storage;

    protected function setUp(): void
    {
        // tijdelijke map, zodat de echte backend/uploads nooit geraakt wordt
        $this->dir = sys_get_temp_dir() . '/kiekje_uploads_' . bin2hex(random_bytes(4));
        $this->storage = new ImageStorage($this->dir);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->dir . '/*') ?: [] as $f) {
            unlink($f);
        }
        @rmdir($this->dir);
    }

    public function test_echte_afbeelding_wordt_opgeslagen_onder_willekeurige_naam(): void
    {
        $path = $this->storage->save('data:image/png;base64,' . self::PNG);

        $this->assertMatchesRegularExpression('#^uploads/[a-f0-9]{32}\.png$#', $path);
        $this->assertFileExists($this->dir . '/' . basename($path));
    }

    public function test_twee_uploads_krijgen_verschillende_namen(): void
    {
        $a = $this->storage->save('data:image/png;base64,' . self::PNG);
        $b = $this->storage->save('data:image/png;base64,' . self::PNG);
        $this->assertNotSame($a, $b);
    }

    public function test_script_vermomd_als_png_wordt_geweigerd(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Bestand is geen geldige afbeelding.');
        $this->storage->save('data:image/png;base64,' . base64_encode('<?php echo "gehackt"; ?>'));
    }

    public function test_verkeerd_type_in_data_url_wordt_geweigerd(): void
    {
        // PNG-inhoud, maar als JPEG aangeboden
        $this->expectException(HttpException::class);
        $this->storage->save('data:image/jpeg;base64,' . self::PNG);
    }

    public function test_geen_data_url_wordt_geweigerd(): void
    {
        try {
            $this->storage->save('https://example.com/foto.jpg');
            $this->fail('Er had een exceptie moeten komen');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatus());
            $this->assertSame('Ongeldige afbeelding.', $e->getMessage());
        }
    }

    public function test_verwijderen_haalt_het_bestand_weg(): void
    {
        $path = $this->storage->save('data:image/png;base64,' . self::PNG);
        $this->storage->delete($path);
        $this->assertFileDoesNotExist($this->dir . '/' . basename($path));
    }

    public function test_verwijderen_negeert_paden_buiten_uploads(): void
    {
        $bestand = $this->dir . '/../kiekje_niet_verwijderen.txt';
        file_put_contents($bestand, 'blijft staan');

        $this->storage->delete('uploads/../kiekje_niet_verwijderen.txt');
        $this->storage->delete('../config/database.php');
        $this->storage->delete(null);

        $this->assertFileExists($bestand);
        unlink($bestand);
    }
}
