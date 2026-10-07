<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendTestMail extends Command
{
    /**
     * @var string
     */
    protected $signature = 'mail:test {to : Dirección que recibirá el correo de prueba}';

    /**
     * @var string
     */
    protected $description = 'Envía un correo de prueba para comprobar la configuración SMTP del .env';

    public function handle(): int
    {
        $to = (string) $this->argument('to');
        $mailer = (string) config('mail.default');

        $this->line("Mailer: {$mailer} · host: ".config("mail.mailers.{$mailer}.host", '—').' · remitente: '.config('mail.from.address'));

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER=log: los correos solo se escriben en storage/logs/laravel.log y no se envían. Usa MAIL_MAILER=smtp.');
        }

        try {
            Mail::raw(
                'Si lees esto, el correo de '.config('app.name').' está funcionando.',
                fn (Message $message) => $message->to($to)->subject('Prueba de correo · '.config('app.name')),
            );
        } catch (Throwable $exception) {
            $this->error('No se pudo enviar: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Correo de prueba enviado a {$to}.");

        return self::SUCCESS;
    }
}
