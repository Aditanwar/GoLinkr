package qr

import (
	"github.com/skip2/go-qrcode"
)

// GenerateQRCodePNG creates a QR code PNG image byte slice
func GenerateQRCodePNG(url string, size int) ([]byte, error) {
	png, err := qrcode.Encode(url, qrcode.Medium, size)
	if err != nil {
		return nil, err
	}
	return png, nil
}
