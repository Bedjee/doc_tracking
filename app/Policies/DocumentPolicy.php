<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\DocumentRoute;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Document $document): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        if ((int) $document->created_by === (int) $user->id) {
            return true;
        }

        if (!$user->office_id) {
            return false;
        }

        $officeId = (int) $user->office_id;

        if (in_array($officeId, [
            (int) $document->originating_office_id,
            (int) $document->current_office_id,
            (int) $document->current_destination_office_id,
        ], true)) {
            return true;
        }

        return $document->routes()->where('office_id', $officeId)->exists();
    }

    public function create(User $user): bool
    {
        return $user->canActOnDocuments();
    }

    /** The user's office must be the current authorized destination. */
   public function receive(User $user, Document $document): bool
{
    if (!$user->canActOnDocuments() || $document->isLocked()) {
        return false;
    }

    if ((int) $document->current_destination_office_id !== (int) $user->office_id) {
        return false;
    }

    // The document must still be in-flight to this office: the current route
    // step for the user's office must be CURRENT, not RECEIVED.
    return $document->routes()
        ->where('office_id', $user->office_id)
        ->where('status', DocumentRoute::STATUS_CURRENT)
        ->exists();
}

    /** The document must be received and held at the user's office. */
    public function forward(User $user, Document $document): bool
    {
        if (!$user->canActOnDocuments() || $document->isLocked()) {
            return false;
        }

        if ((int) $document->current_office_id !== (int) $user->office_id) {
            return false;
        }

        $step = $document->routes()
            ->where('office_id', $user->office_id)
            ->where('status', DocumentRoute::STATUS_RECEIVED)
            ->exists();

        if (!$step) {
            return false;
        }

        return $document->routes()
            ->where('status', DocumentRoute::STATUS_PENDING)
            ->exists();
    }

    public function returnDocument(User $user, Document $document): bool
    {
        if (!$user->canActOnDocuments() || $document->isLocked()) {
            return false;
        }

        return (int) $document->current_office_id === (int) $user->office_id
            && $document->routes()
                ->where('office_id', $user->office_id)
                ->where('status', DocumentRoute::STATUS_RECEIVED)
                ->exists();
    }

    public function cancel(User $user, Document $document): bool
    {
        if ($document->isLocked()) {
            return false;
        }

        return $user->isAdministrator() || (int) $document->created_by === (int) $user->id;
    }

    public function manageSystem(User $user): bool
    {
        return $user->isAdministrator();
    }
}