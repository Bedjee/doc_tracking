<?php

namespace App\Http\Controllers;

use App\Services\DocumentReminderService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private DocumentReminderService $reminders) {}

    /**
     * Mark the given reminder keys as read for the authenticated user.
     * Responds with an Inertia redirect so router.post handles it silently.
     */
    public function markRead(Request $request)
    {
        $data = $request->validate([
            'keys'   => ['required', 'array'],
            'keys.*' => ['string', 'max:120'],
        ]);

        $this->reminders->markRead($request->user(), $data['keys']);

        return back();
    }

    /**
     * Mark all current reminders for the user's office as read.
     */
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        $unread = $this->reminders->unreadFor($user);

        $this->reminders->markRead(
            $user,
            $unread->pluck('key')->all()
        );

        return back();
    }
}