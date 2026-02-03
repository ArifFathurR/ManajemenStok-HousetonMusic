<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProdukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // --- VALIDASI UMUM ---
            'nama_produk'   => ['required', 'string', 'max:255'],
            'kategori'      => ['nullable', 'string', 'max:100'],
            'satuan'        => ['required', 'string', 'max:50'],
            'deskripsi'     => ['nullable', 'string'],
            'gambar'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            // Wajib kirim status varian (true/false)
            'is_variant'    => ['required', 'boolean'],

            // --- SKENARIO 1: PRODUK TUNGGAL (is_variant = false) ---
            // Gunakan 'exclude_if:is_variant,true' -> Artinya: Kalau varian aktif, abaikan kolom ini.
            'stok'          => ['exclude_if:is_variant,true', 'required', 'integer', 'min:0'],
            'harga_online'  => ['exclude_if:is_variant,true', 'required', 'numeric', 'min:0'],
            'harga_offline' => ['exclude_if:is_variant,true', 'required', 'numeric', 'min:0'],

            // --- SKENARIO 2: PRODUK VARIAN (is_variant = true) ---
            // Gunakan 'exclude_if:is_variant,false' -> Artinya: Kalau varian TIDAK aktif, abaikan kolom ini.
            'varians'                 => ['exclude_if:is_variant,false', 'required', 'array', 'min:1'],
            'varians.*.nama_varian'   => ['exclude_if:is_variant,false', 'required', 'string'],
            'varians.*.stok'          => ['exclude_if:is_variant,false', 'required', 'integer', 'min:0'],
            'varians.*.harga_online'  => ['exclude_if:is_variant,false', 'required', 'numeric', 'min:0'],
            'varians.*.harga_offline' => ['exclude_if:is_variant,false', 'required', 'numeric', 'min:0'],
            'varians.*.gambar'        => ['exclude_if:is_variant,false', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    // (Opsional) Custom Message biar errornya lebih enak dibaca user
    public function messages(): array
    {
        return [
            'varians.required' => 'Minimal harus ada satu varian jika mode varian aktif.',
            'varians.*.nama_varian.required' => 'Nama varian wajib diisi.',
            'varians.*.stok.required' => 'Stok varian wajib diisi.',
            // dll...
        ];
    }
}
