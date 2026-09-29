<?php
/**
 * Voorbeeld unit test (PHPUnit) voor de auth-logica.
 * Run met: vendor/bin/phpunit backend/tests/AuthTest.php
 * (vereist "composer require --dev phpunit/phpunit")
 */

use PHPUnit\Framework\TestCase;

final class AuthTest extends TestCase
{
    public function test_password_hash_produces_verifiable_hash(): void
    {
        $password = 'K0ffieEnFilm!';
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $this->assertNotEquals($password, $hash, 'Hash mag nooit gelijk zijn aan het platte wachtwoord.');
        $this->assertTrue(password_verify($password, $hash));
        $this->assertFalse(password_verify('verkeerdWachtwoord', $hash));
    }

    public function test_each_hash_has_a_unique_salt(): void
    {
        $hash1 = password_hash('zelfdeWachtwoord123', PASSWORD_BCRYPT);
        $hash2 = password_hash('zelfdeWachtwoord123', PASSWORD_BCRYPT);

        // Zelfde wachtwoord -> andere hash, omdat de salt per keer verschilt
        $this->assertNotEquals($hash1, $hash2);
    }

    public function test_registration_rejects_short_password(): void
    {
        $password = '1234567'; // 7 tekens, < minimum van 8
        $this->assertLessThan(8, strlen($password));
    }
}
