<?php

namespace App\Services;

class ImportResult
{
    public int $success;
    public int $failed;
    public int $updated;
    public int $created;
    public array $errors;

    public function __construct(array $data)
    {
        $this->success = $data['success'] ?? 0;
        $this->failed = $data['failed'] ?? 0;
        $this->updated = $data['updated'] ?? 0;
        $this->created = $data['created'] ?? 0;
        $this->errors = $data['errors'] ?? [];
    }

    /**
     * Get summary message
     */
    public function summary(): string
    {
        $message = "Import completed. ";
        $message .= "Created: {$this->created}, ";
        $message .= "Updated: {$this->updated}, ";
        $message .= "Failed: {$this->failed}";

        if (!empty($this->errors)) {
            $errorCount = count($this->errors);
            $message .= ". {$errorCount} error(s) occurred.";
        }

        return $message;
    }

    /**
     * Get limited errors (first 10) to avoid session size issues
     */
    public function limitedErrors(): array
    {
        if (empty($this->errors)) {
            return [];
        }

        $errorMessages = array_slice($this->errors, 0, 10);
        $errorCount = count($this->errors);
        
        if ($errorCount > 10) {
            $errorMessages[] = "... and " . ($errorCount - 10) . " more errors";
        }

        return $errorMessages;
    }
}

