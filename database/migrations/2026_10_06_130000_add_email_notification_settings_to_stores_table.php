<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->boolean('notify_new_sales')->default(true)->after('payment_instructions');
            $table->boolean('notify_payment_claims')->default(true)->after('notify_new_sales');
            $table->boolean('notify_low_stock')->default(true)->after('notify_payment_claims');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['notify_new_sales', 'notify_payment_claims', 'notify_low_stock']);
        });
    }
};
