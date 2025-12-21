<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email? : The email address to send the test email to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify SMTP configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? $this->ask('Enter email address to send test email to');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address!');
            return 1;
        }

        $this->info("Sending test email to: {$email}");

        try {
            Mail::raw('This is a test email from your Laravel application. If you receive this, your SMTP configuration is working correctly!', function ($message) use ($email) {
                $message->to($email)
                    ->subject('Test Email - SMTP Configuration');
            });

            $this->info('✓ Email sent successfully!');
            $this->line('');
            $this->line('Check your inbox (and spam folder) for the test email.');

            return 0;
        } catch (\Exception $e) {
            $this->error('✗ Failed to send email!');
            $this->error('Error: ' . $e->getMessage());
            $this->line('');
            $this->line('Please check your SMTP configuration in .env file:');
            $this->line('  - MAIL_HOST');
            $this->line('  - MAIL_PORT');
            $this->line('  - MAIL_USERNAME');
            $this->line('  - MAIL_PASSWORD');
            $this->line('  - MAIL_ENCRYPTION');

            return 1;
        }
    }
}

