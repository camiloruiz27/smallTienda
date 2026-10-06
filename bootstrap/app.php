<?php

use App\Http\Middleware\EnsureStoreMember;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'store.member' => EnsureStoreMember::class,
        ]);

        // The membership check needs the {store} route parameter already bound to a model.
        $middleware->appendToPriorityList(after: SubstituteBindings::class, append: EnsureStoreMember::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
