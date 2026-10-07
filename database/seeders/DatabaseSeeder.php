<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with a demo owner and store (local/testing only).
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $this->call(DemoStoreSeeder::class);
    }
}
