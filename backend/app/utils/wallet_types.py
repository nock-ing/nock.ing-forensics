import re
from typing import Dict, Any
from enum import Enum


class BitcoinWalletType(Enum):
    """Enum for Bitcoin wallet address types"""
    LEGACY_P2PKH = "Legacy (P2PKH)"
    LEGACY_P2SH = "Legacy (P2SH)"
    SEGWIT_NATIVE_P2WPKH = "SegWit Native (P2WPKH)"
    SEGWIT_NATIVE_P2WSH = "SegWit Native (P2WSH)"
    SEGWIT_NESTED_P2SH = "SegWit Nested (P2SH-P2WPKH/P2WSH)"
    TAPROOT_P2TR = "Taproot (P2TR)"
    UNKNOWN = "Unknown"


def identify_bitcoin_wallet_type(address: str) -> Dict[str, Any]:
    """
    Identify Bitcoin wallet type based on address format.

    Args:
        address (str): Bitcoin address string

    Returns:
        Dict containing wallet type, description, and technical details
    """
    if not address or not isinstance(address, str):
        return {
            "type": BitcoinWalletType.UNKNOWN,
            "description": "Invalid address format",
            "technical_name": None,
            "version_byte": None,
            "encoding": None,
            "is_segwit": False,
            "is_taproot": False
        }

    address = address.strip()

    # Legacy P2PKH addresses (starts with 1)
    if re.match(r'^1[a-km-zA-HJ-NP-Z1-9]{25,34}$', address):
        return {
            "type": BitcoinWalletType.LEGACY_P2PKH,
            "description": "Legacy Pay-to-Public-Key-Hash address",
            "technical_name": "P2PKH",
            "version_byte": "0x00",
            "encoding": "Base58Check",
            "is_segwit": False,
            "is_taproot": False
        }

    # Legacy P2SH addresses (starts with 3)
    elif re.match(r'^3[a-km-zA-HJ-NP-Z1-9]{25,34}$', address):
        return {
            "type": BitcoinWalletType.LEGACY_P2SH,
            "description": "Legacy Pay-to-Script-Hash address (could be SegWit nested)",
            "technical_name": "P2SH",
            "version_byte": "0x05",
            "encoding": "Base58Check",
            "is_segwit": False,  # Could be nested SegWit, but we can't tell from address alone
            "is_taproot": False
        }

    # Native SegWit P2WPKH addresses (starts with bc1q, 42 chars)
    elif re.match(r'^bc1q[a-z0-9]{38}$', address):
        return {
            "type": BitcoinWalletType.SEGWIT_NATIVE_P2WPKH,
            "description": "Native SegWit Pay-to-Witness-Public-Key-Hash address",
            "technical_name": "P2WPKH",
            "version_byte": "0x00",
            "encoding": "Bech32",
            "is_segwit": True,
            "is_taproot": False
        }

    # Native SegWit P2WSH addresses (starts with bc1q, 62 chars)
    elif re.match(r'^bc1q[a-z0-9]{58}$', address):
        return {
            "type": BitcoinWalletType.SEGWIT_NATIVE_P2WSH,
            "description": "Native SegWit Pay-to-Witness-Script-Hash address",
            "technical_name": "P2WSH",
            "version_byte": "0x00",
            "encoding": "Bech32",
            "is_segwit": True,
            "is_taproot": False
        }

    # Taproot P2TR addresses (starts with bc1p, 62 chars)
    elif re.match(r'^bc1p[a-z0-9]{58}$', address):
        return {
            "type": BitcoinWalletType.TAPROOT_P2TR,
            "description": "Taproot Pay-to-Taproot address",
            "technical_name": "P2TR",
            "version_byte": "0x01",
            "encoding": "Bech32m",
            "is_segwit": True,
            "is_taproot": True
        }

    # Testnet addresses
    elif address.startswith(('m', 'n', '2', 'tb1q', 'tb1p')):
        return _identify_testnet_address(address)

    # Unknown format
    else:
        return {
            "type": BitcoinWalletType.UNKNOWN,
            "description": "Unknown or invalid Bitcoin address format",
            "technical_name": None,
            "version_byte": None,
            "encoding": None,
            "is_segwit": False,
            "is_taproot": False
        }


def _identify_testnet_address(address: str) -> Dict[str, Any]:
    """Helper function to identify testnet addresses"""

    # Testnet P2PKH (starts with m or n)
    if re.match(r'^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$', address):
        return {
            "type": BitcoinWalletType.LEGACY_P2PKH,
            "description": "Testnet Legacy P2PKH address",
            "technical_name": "P2PKH (Testnet)",
            "version_byte": "0x6f",
            "encoding": "Base58Check",
            "is_segwit": False,
            "is_taproot": False
        }

    # Testnet P2SH (starts with 2)
    elif re.match(r'^2[a-km-zA-HJ-NP-Z1-9]{25,34}$', address):
        return {
            "type": BitcoinWalletType.LEGACY_P2SH,
            "description": "Testnet Legacy P2SH address",
            "technical_name": "P2SH (Testnet)",
            "version_byte": "0xc4",
            "encoding": "Base58Check",
            "is_segwit": False,
            "is_taproot": False
        }

    # Testnet Native SegWit P2WPKH (starts with tb1q, 42 chars)
    elif re.match(r'^tb1q[a-z0-9]{38}$', address):
        return {
            "type": BitcoinWalletType.SEGWIT_NATIVE_P2WPKH,
            "description": "Testnet Native SegWit P2WPKH address",
            "technical_name": "P2WPKH (Testnet)",
            "version_byte": "0x00",
            "encoding": "Bech32",
            "is_segwit": True,
            "is_taproot": False
        }

    # Testnet Native SegWit P2WSH (starts with tb1q, 62 chars)
    elif re.match(r'^tb1q[a-z0-9]{58}$', address):
        return {
            "type": BitcoinWalletType.SEGWIT_NATIVE_P2WSH,
            "description": "Testnet Native SegWit P2WSH address",
            "technical_name": "P2WSH (Testnet)",
            "version_byte": "0x00",
            "encoding": "Bech32",
            "is_segwit": True,
            "is_taproot": False
        }

    # Testnet Taproot P2TR (starts with tb1p, 62 chars)
    elif re.match(r'^tb1p[a-z0-9]{58}$', address):
        return {
            "type": BitcoinWalletType.TAPROOT_P2TR,
            "description": "Testnet Taproot P2TR address",
            "technical_name": "P2TR (Testnet)",
            "version_byte": "0x01",
            "encoding": "Bech32m",
            "is_segwit": True,
            "is_taproot": True
        }

    else:
        return {
            "type": BitcoinWalletType.UNKNOWN,
            "description": "Unknown testnet address format",
            "technical_name": None,
            "version_byte": None,
            "encoding": None,
            "is_segwit": False,
            "is_taproot": False
        }


def get_wallet_type_summary(address: str) -> str:
    """
    Get a simple string summary of the wallet type.

    Args:
        address (str): Bitcoin address string

    Returns:
        str: Simple wallet type description
    """
    result = identify_bitcoin_wallet_type(address)
    return result["type"].value


def is_segwit_address(address: str) -> bool:
    """
    Check if an address is a SegWit address.

    Args:
        address (str): Bitcoin address string

    Returns:
        bool: True if SegWit address, False otherwise
    """
    result = identify_bitcoin_wallet_type(address)
    return result["is_segwit"]


def is_taproot_address(address: str) -> bool:
    """
    Check if an address is a Taproot address.

    Args:
        address (str): Bitcoin address string

    Returns:
        bool: True if Taproot address, False otherwise
    """
    result = identify_bitcoin_wallet_type(address)
    return result["is_taproot"]
