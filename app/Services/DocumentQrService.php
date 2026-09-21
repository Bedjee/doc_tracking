<?php

namespace App\Services;

use App\Models\Document;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class DocumentQrService
{
    /**
     * The QR payload is intentionally minimal — it only identifies the
     * document. All authorization/data lookups happen server-side.
     */
    public function payload(Document $document): string
    {
        return $document->tracking_number;
    }

    public function svg(Document $document, int $size = 320): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, 1),
            new SvgImageBackEnd()
        );

        return (new Writer($renderer))->writeString($this->payload($document));
    }

    public function dataUri(Document $document, int $size = 320): string
    {
        return 'data:image/svg+xml;base64,' . base64_encode($this->svg($document, $size));
    }
}