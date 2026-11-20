"""Signs a zip into a CRX3 file for "Verified CRX uploads" on the Chrome Web Store.

Usage: python3 scripts/sign-crx.py dist/braille.zip key.pem dist/braille.crx
Only needs openssl, so it runs on a plain CI runner.
"""
import hashlib
import struct
import subprocess
import sys


def varint(n):
    out = bytearray()
    while True:
        byte = n & 0x7F
        n >>= 7
        if n:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            return bytes(out)


def field(number, data):
    """Encodes a protobuf bytes field."""
    return varint(number << 3 | 2) + varint(len(data)) + data


def main(zip_path, key_path, crx_path):
    with open(zip_path, "rb") as f:
        archive = f.read()

    public_key = subprocess.run(
        ["openssl", "pkey", "-in", key_path, "-pubout", "-outform", "DER"],
        check=True, capture_output=True,
    ).stdout

    # the CRX id is the first 16 bytes of the public key's sha256
    signed_data = field(1, hashlib.sha256(public_key).digest()[:16])

    message = b"CRX3 SignedData\x00" + struct.pack("<I", len(signed_data)) + signed_data + archive
    signature = subprocess.run(
        ["openssl", "dgst", "-sha256", "-sign", key_path],
        input=message, check=True, capture_output=True,
    ).stdout

    # CrxFileHeader: field 2 is the RSA proof, field 10000 is the signed data
    proof = field(1, public_key) + field(2, signature)
    header = field(2, proof) + field(10000, signed_data)

    with open(crx_path, "wb") as f:
        f.write(b"Cr24" + struct.pack("<II", 3, len(header)) + header + archive)


if __name__ == "__main__":
    main(*sys.argv[1:])
