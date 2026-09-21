<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use thiagoalessio\TesseractOCR\TesseractOCR;

class DocumentOcrService
{
    /**
     * Extract suggested metadata from a document image.
     * OCR is an ASSISTANT — the user always confirms/edits before saving.
     *
     * @return array{title:?string,reference_number:?string,date:?string,subject:?string,raw_text:string}
     */
    public function extract(string $absolutePath): array
    {
        $text = $this->runTesseract($absolutePath);

        return [
            'title'            => $this->guessTitle($text),
            'reference_number' => $this->guessReferenceNumber($text),
            'date'             => $this->guessDate($text),
            'subject'          => $this->guessSubject($text),
            'raw_text'         => $text,
        ];
    }

private function runTesseract(string $absolutePath): string
{
    $binary = config('services.tesseract.binary', 'tesseract');

    try {
        $ocr = new TesseractOCR($absolutePath);

        if ($binary && $binary !== 'tesseract') {
            $ocr->executable($binary);
        }

        return $ocr->lang('eng')->psm(6)->run();
    } catch (\Throwable $e) {
        \Log::warning('OCR failed', [
            'error'  => $e->getMessage(),
            'path'   => $absolutePath,
            'binary' => $binary,
        ]);

        return '';
    }
}
    /**
     * Heuristic: the title is usually a prominent, mostly-uppercase line near
     * the top. We return candidates as a suggestion only.
     */
    private function guessTitle(string $text): ?string
    {
        $lines = $this->cleanLines($text);

        $noise = [
            'REPUBLIC OF THE PHILIPPINES', 'OFFICE OF THE', 'MUNICIPALITY OF',
            'CITY OF', 'BARANGAY', 'PROVINCE OF',
        ];

        $candidates = [];

        foreach (array_slice($lines, 0, 25) as $index => $line) {
            if (mb_strlen($line) < 6 || mb_strlen($line) > 120) {
                continue;
            }
            if (!preg_match('/[A-Za-z]{4,}/', $line)) {
                continue;
            }

            $skip = false;
            foreach ($noise as $needle) {
                if (str_contains(mb_strtoupper($line), $needle)) {
                    $skip = true;
                    break;
                }
            }
            if ($skip) {
                continue;
            }

            $upperRatio = $this->upperRatio($line);

            // Prefer all-caps lines that appear early in the document.
            $score = ($upperRatio * 10) + (1 / ($index + 1));

            $candidates[] = ['line' => $line, 'score' => $score];
        }

        if (empty($candidates)) {
            return null;
        }

        usort($candidates, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $this->titleCase($candidates[0]['line']);
    }

    private function guessReferenceNumber(string $text): ?string
    {
        $patterns = [
            '/\b(?:REF(?:ERENCE)?\.?\s*(?:NO\.?|NUMBER|#)?\s*[:\-]?\s*)([A-Z0-9][A-Z0-9\-\/\.]{3,30})/i',
            '/\b(?:PO|PR|SO|AO|MO|NO)\.?\s*(?:NO\.?|#)?\s*[:\-]?\s*([0-9][0-9\-\/\.]{2,20})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                return trim($m[1]);
            }
        }

        return null;
    }

    private function guessDate(string $text): ?string
    {
        $patterns = [
            '/\b(\d{4}-\d{2}-\d{2})\b/',
            '/\b([A-Z][a-z]+ \d{1,2},? \d{4})\b/',
            '/\b(\d{1,2} [A-Z][a-z]+ \d{4})\b/',
            '/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                try {
                    return \Carbon\Carbon::parse($m[1])->toDateString();
                } catch (\Throwable) {
                    continue;
                }
            }
        }

        return null;
    }

    private function guessSubject(string $text): ?string
    {
        $lines = $this->cleanLines($text);

        foreach ($lines as $index => $line) {
            if (preg_match('/^\s*SUBJECT\s*[:\-]\s*(.+)$/i', $line, $m)) {
                return trim($m[1]);
            }

            if (preg_match('/^\s*SUBJECT\s*[:\-]?\s*$/i', $line) && isset($lines[$index + 1])) {
                return trim($lines[$index + 1]);
            }
        }

        return null;
    }

    /* ---------- helpers ---------- */

    private function cleanLines(string $text): array
    {
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        return array_values(array_filter(
            array_map(fn ($l) => trim(preg_replace('/\s+/', ' ', $l)), $lines),
            fn ($l) => $l !== ''
        ));
    }

    private function upperRatio(string $line): float
    {
        $letters = preg_replace('/[^A-Za-z]/', '', $line);
        if ($letters === '') {
            return 0.0;
        }

        $upper = preg_replace('/[^A-Z]/', '', $line);

        return strlen($upper) / strlen($letters);
    }

    private function titleCase(string $line): string
    {
        // If OCR read it in caps, present it in Title Case for the user.
        if ($this->upperRatio($line) > 0.9) {
            return mb_convert_case(mb_strtolower($line), MB_CASE_TITLE);
        }

        return $line;
    }
}