<?php

use Kiekje\Controllers\Controller;
use Kiekje\Core\Request;
use Kiekje\Core\Session;
use Kiekje\Repositories\LikeTable;
use PHPUnit\Framework\TestCase;

/** Test-controller: laat zien hoe de abstracte basisklasse acties kiest en fouten afhandelt. */
final class PingController extends Controller
{
    public bool $gepingd = false;

    protected function handle(): void
    {
        $this->dispatch(['ping' => 'ping', 'crash' => 'crash', 'geheim' => 'geheim'], $this->request->action(), 404);
    }

    protected function ping(): void
    {
        $this->gepingd = true;
        $this->ok(['pong' => true]);
    }

    protected function crash(): void
    {
        throw new RuntimeException('interne details die de browser niet mag zien');
    }

    protected function geheim(): void
    {
        $this->currentUser(); // vereist inloggen
        $this->ok();
    }
}

/** Nep-sessie zonder ingelogde gebruiker (dependency injection: geen echte PHP-sessie nodig). */
final class NiemandIngelogd extends Session
{
    public function userId(): ?int
    {
        return null;
    }
}

final class ControllerTest extends TestCase
{
    protected function setUp(): void
    {
        ini_set('error_log', tempnam(sys_get_temp_dir(), 'kiekje_log')); // foutmeldingen niet in de testuitvoer
    }

    protected function tearDown(): void
    {
        unset($_GET['action']);
    }

    /** Draait een controller en geeft het JSON-antwoord als array terug. */
    private function draai(string $action, ?Session $session = null): array
    {
        $_GET['action'] = $action;
        $controller = new PingController(new Request(), $session ?? new NiemandIngelogd());
        ob_start();
        $controller->run();
        return json_decode(ob_get_clean(), true);
    }

    public function test_bekende_actie_roept_de_juiste_methode_aan(): void
    {
        $this->assertSame(['success' => true, 'pong' => true], $this->draai('ping'));
    }

    public function test_onbekende_actie_geeft_nette_foutmelding(): void
    {
        $this->assertSame(['success' => false, 'error' => 'Onbekende actie.'], $this->draai('bestaat_niet'));
    }

    public function test_onverwachte_fout_lekt_geen_details_naar_de_browser(): void
    {
        $antwoord = $this->draai('crash');
        $this->assertSame('Serverfout.', $antwoord['error']);
        $this->assertStringNotContainsString('interne details', json_encode($antwoord));
    }

    public function test_zonder_inloggen_geen_toegang(): void
    {
        $this->assertSame(['success' => false, 'error' => 'Niet ingelogd'], $this->draai('geheim'));
    }

    public function test_like_tabel_accepteert_alleen_bekende_tabellen(): void
    {
        $pdo = $this->createMock(PDO::class);
        new LikeTable($pdo, 'likes'); // toegestaan

        $this->expectException(InvalidArgumentException::class);
        new LikeTable($pdo, 'users; DROP TABLE users'); // nooit een tabelnaam uit invoer
    }
}
