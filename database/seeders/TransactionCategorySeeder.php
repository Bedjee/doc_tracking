<?php

namespace Database\Seeders;

use App\Models\TransactionCategory;
use Illuminate\Database\Seeder;

class TransactionCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Simple Transaction',
                'code'        => 'SIMPLE',
                'description' => 'Straightforward requests that can be processed quickly.',
                'min_days'    => 3,
                'max_days'    => 3,
            ],
            [
                'name'        => 'Complex Transaction',
                'code'        => 'COMPLEX',
                'description' => 'Requires coordination across multiple units or verification steps.',
                'min_days'    => 7,
                'max_days'    => 7,
            ],
            [
                'name'        => 'Highly Technical Transaction',
                'code'        => 'HIGHLY_TECHNICAL',
                'description' => 'In-depth review, technical evaluation, or extended analysis required.',
                'min_days'    => 20,
                'max_days'    => 30,
            ],
        ];

        foreach ($categories as $category) {
            TransactionCategory::updateOrCreate(
                ['code' => $category['code']],
                array_merge($category, ['is_active' => true])
            );
        }
    }
}