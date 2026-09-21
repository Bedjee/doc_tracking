<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Office;
use App\Http\Controllers\OfficeHead;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('dashboard'));

Route::middleware(['auth', 'active'])->group(function () {

    // Single dashboard URL — dispatches by role internally
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ---------------- Administrator ----------------
    Route::middleware('role:administrator')->group(function () {
        Route::resource('offices', Admin\OfficeController::class)->except(['show']);
        Route::resource('users', Admin\UserController::class)->except(['show']);
        Route::resource('document-types', Admin\DocumentTypeController::class)
            ->except(['show', 'create', 'edit']);

        // Admin-only document view (all documents, no office filter)
        Route::prefix('admin')->name('admin.')->group(function () {
            Route::get('/documents', [Admin\DocumentController::class, 'index'])->name('documents.index');
            Route::get('/documents/{document}', [Admin\DocumentController::class, 'show'])->name('documents.show');
            Route::get('/monitor', [Admin\DocumentMonitorController::class, 'index'])->name('monitor.index');
        });
    });

    // ---------------- Office Head ----------------
    Route::middleware('role:office_head')->prefix('head')->name('head.')->group(function () {
        Route::get('/documents', [OfficeHead\OfficeDocumentController::class, 'index'])->name('documents.index');
        Route::get('/monitor', [\App\Http\Controllers\OfficeHead\DocumentMonitorController::class, 'index'])
        ->name('monitor.index');
    });

    // ---------------- Office User + Office Head (day-to-day actions) ----------------
    Route::middleware('role:office_user,office_head')->group(function () {
        // Documents
        Route::get('/documents', [Office\DocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/create', [Office\DocumentController::class, 'create'])->name('documents.create');
        Route::post('/documents', [Office\DocumentController::class, 'store'])->name('documents.store');
        Route::post('/documents/ocr', [Office\DocumentController::class, 'ocr'])->name('documents.ocr');
        Route::get('/documents/{document}', [Office\DocumentController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/qr', [Office\DocumentController::class, 'qr'])->name('documents.qr');

        // Scanning / routing
        Route::get('/scan', [Office\ScanController::class, 'index'])->name('scan.index');
        Route::post('/scan/lookup', [Office\ScanController::class, 'lookup'])->name('scan.lookup');
        Route::post('/documents/{document}/receive', [Office\ScanController::class, 'receive'])->name('documents.receive');
        Route::post('/documents/{document}/forward', [Office\ScanController::class, 'forward'])->name('documents.forward');
        Route::post('/documents/{document}/return',  [Office\ScanController::class, 'returnDocument'])->name('documents.return');
        Route::post('/documents/{document}/cancel',  [Office\ScanController::class, 'cancel'])->name('documents.cancel');
    });
});

require __DIR__.'/auth.php';