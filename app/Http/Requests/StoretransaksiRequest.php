<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoretransaksiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Ubah menjadi true
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:produk,id',
            'cart.*.variantId' => 'nullable|exists:produk_varian,id',
            'cart.*.qty' => 'required|integer|min:1',
            'channel' => 'required|in:online,offline',
            'paymentMethod' => 'required|in:cash,debit,qr',
            'discount' => 'nullable|numeric|min:0',
            'customerMoney' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'cart.required' => 'Keranjang belanja tidak boleh kosong',
            'cart.min' => 'Minimal harus ada 1 produk dalam keranjang',
            'cart.*.id.required' => 'ID Produk harus diisi',
            'cart.*.id.exists' => 'Produk tidak ditemukan',
            'cart.*.qty.required' => 'Jumlah produk harus diisi',
            'cart.*.qty.min' => 'Jumlah produk minimal 1',
            'channel.required' => 'Channel penjualan harus dipilih',
            'channel.in' => 'Channel penjualan tidak valid',
            'paymentMethod.required' => 'Metode pembayaran harus dipilih',
            'paymentMethod.in' => 'Metode pembayaran tidak valid',
            'discount.numeric' => 'Diskon harus berupa angka',
            'discount.min' => 'Diskon tidak boleh kurang dari 0',
            'customerMoney.numeric' => 'Uang pembayaran harus berupa angka',
            'customerMoney.min' => 'Uang pembayaran tidak boleh kurang dari 0',
        ];
    }
}