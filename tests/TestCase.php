<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Feature tests assert on the Inertia payload, so they must not depend on a compiled Vite build.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }
}
