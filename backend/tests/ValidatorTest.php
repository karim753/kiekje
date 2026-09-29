<?php

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use PHPUnit\Framework\TestCase;

final class ValidatorTest extends TestCase
{
    public function test_geldige_gebruikersnaam_wordt_geaccepteerd(): void
    {
        Validator::username('lisa_natuur');
        Validator::username('tim.opreis');
        $this->addToAssertionCount(2); // geen exceptie = goed
    }

    public function test_te_korte_gebruikersnaam_geeft_422(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Gebruikersnaam moet 3 tot 30 tekens lang zijn.');
        Validator::username('ab');
    }

    public function test_te_lange_gebruikersnaam_wordt_geweigerd(): void
    {
        $this->expectException(HttpException::class);
        Validator::username(str_repeat('x', 31));
    }

    public function test_gebruikersnaam_met_spatie_wordt_geweigerd(): void
    {
        try {
            Validator::username('lisa natuur');
            $this->fail('Er had een exceptie moeten komen');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatus());
            $this->assertSame('Gebruikersnaam mag geen spaties bevatten.', $e->getMessage());
        }
    }

    public function test_gebruikersnaam_met_apenstaartje_wordt_geweigerd(): void
    {
        // anders kan iemand het e-mailadres van een ander als gebruikersnaam kiezen
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Gebruikersnaam mag geen @ bevatten.');
        Validator::username('iemand@hotmail.com');
    }

    public function test_ongeldig_emailadres_wordt_geweigerd(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Ongeldig e-mailadres.');
        Validator::email('geen-emailadres');
    }

    public function test_max_lengte_telt_tekens_niet_bytes(): void
    {
        // 160 tekens met emoji: in bytes veel langer, maar wel toegestaan
        Validator::maxLength(str_repeat('🌲', 160), 160, 'te lang');
        $this->expectException(HttpException::class);
        Validator::maxLength(str_repeat('🌲', 161), 160, 'te lang');
    }

    public function test_verplicht_veld_met_eigen_statuscode(): void
    {
        try {
            Validator::required('', 'Gebruiker ontbreekt', 400);
            $this->fail('Er had een exceptie moeten komen');
        } catch (HttpException $e) {
            $this->assertSame(400, $e->getStatus());
        }
    }
}
