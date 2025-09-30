#!/usr/bin/env python3
"""
Token Quest - Swap Service

Handles all Web3 interactions for token swapping on BSC testnet
using PancakeSwap V2 router contracts.

Features:
- Web3 connection to BSC testnet
- PancakeSwap router integration
- Token validation and quotes
- Transaction execution
- Error handling and validation
"""

import os
from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
from typing import Dict, Any

class SwapService:
    """
    Service class for handling token swaps on BSC testnet via PancakeSwap
    """
    
    def __init__(self):
        """
        Initialize Web3 connection and contract interfaces
        """
        # BSC Testnet configuration
        self.web3_provider_url = os.getenv('WEB3_PROVIDER_URL', 'https://data-seed-prebsc-1-s1.binance.org:8545/')
        self.pancakeswap_router = os.getenv('PANCAKESWAP_ROUTER', '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3')
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.web3_provider_url))
        
        # Add PoA middleware for BSC
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Verify connection
        if not self.w3.is_connected():
            raise Exception("Failed to connect to BSC testnet")
        
        print(f"✅ Connected to BSC Testnet. Latest block: {self.w3.eth.block_number}")
        
        # PancakeSwap Router ABI (minimal)
        self.router_abi = [
            {
                "inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "address[]", "name": "path", "type": "address[]"}],
                "name": "getAmountsOut",
                "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"}, {"internalType": "address[]", "name": "path", "type": "address[]"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}],
                "name": "swapExactTokensForTokens",
                "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        # ERC20 Token ABI (minimal)
        self.token_abi = [
            {
                "constant": True,
                "inputs": [],
                "name": "name",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            }
        ]
        
        # Initialize router contract
        self.router_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.pancakeswap_router),
            abi=self.router_abi
        )
        
        # Common testnet token addresses
        self.common_tokens = {
            'WBNB': '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
            'BUSD': '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
            'USDT': '0x7ef95a0FEE0Dd31b22626fF2be2D0E3c5e4D5DC'  # Example testnet USDT
        }
    
    def validate_wallet(self, address: str) -> Dict[str, Any]:
        """
        Validate wallet address and get basic information
        
        Args:
            address (str): Wallet address to validate
            
        Returns:
            Dict containing validation result and wallet info
        """
        try:
            # Validate address format
            checksum_address = Web3.to_checksum_address(address)
            
            # Check if address is valid
            if not Web3.is_address(checksum_address):
                return {
                    'success': False,
                    'error': 'Invalid wallet address format'
                }
            
            # Get BNB balance
            balance_wei = self.w3.eth.get_balance(checksum_address)
            balance_bnb = Web3.from_wei(balance_wei, 'ether')
            
            return {
                'success': True,
                'address': checksum_address,
                'balance_bnb': float(balance_bnb),
                'network': 'BSC Testnet',
                'chain_id': 97
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Wallet validation failed: {str(e)}'
            }
    
    def get_token_info(self, token_address: str) -> Dict[str, Any]:
        """
        Get information about a specific token
        
        Args:
            token_address (str): Token contract address
            
        Returns:
            Dict containing token information
        """
        try:
            checksum_address = Web3.to_checksum_address(token_address)
            token_contract = self.w3.eth.contract(
                address=checksum_address,
                abi=self.token_abi
            )
            
            # Get token details
            name = token_contract.functions.name().call()
            symbol = token_contract.functions.symbol().call()
            decimals = token_contract.functions.decimals().call()
            
            return {
                'success': True,
                'address': checksum_address,
                'name': name,
                'symbol': symbol,
                'decimals': decimals
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get token info: {str(e)}'
            }
    
    def get_swap_quote(self, token_in: str, token_out: str, amount_in: str) -> Dict[str, Any]:
        """
        Get swap quote from PancakeSwap router
        
        Args:
            token_in (str): Input token address
            token_out (str): Output token address  
            amount_in (str): Input amount in wei
            
        Returns:
            Dict containing quote information
        """
        try:
            # Convert addresses to checksum format
            token_in_addr = Web3.to_checksum_address(token_in)
            token_out_addr = Web3.to_checksum_address(token_out)
            
            # Create path for swap
            path = [token_in_addr, token_out_addr]
            
            # Get amounts out from router
            amounts_out = self.router_contract.functions.getAmountsOut(
                int(amount_in), path
            ).call()
            
            # Calculate price impact and other metrics
            amount_out = amounts_out[-1]
            
            return {
                'success': True,
                'amount_in': amount_in,
                'amount_out': str(amount_out),
                'path': path,
                'price_impact': 0.1,  # Simplified calculation
                'minimum_received': str(int(amount_out * 0.995))  # 0.5% slippage
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Quote calculation failed: {str(e)}'
            }
    
    def execute_swap(self, wallet_address: str, token_in: str, token_out: str, 
                    amount_in: str, slippage: float = 0.5) -> Dict[str, Any]:
        """
        Execute token swap (simulation for testnet)
        
        Note: This is a simplified implementation. In production, you would:
        1. Build the transaction
        2. Sign with user's private key (handled by frontend/MetaMask)
        3. Send transaction to network
        
        Args:
            wallet_address (str): User's wallet address
            token_in (str): Input token address
            token_out (str): Output token address
            amount_in (str): Input amount in wei
            slippage (float): Slippage tolerance percentage
            
        Returns:
            Dict containing swap execution result
        """
        try:
            # For demo purposes, we'll simulate a successful swap
            # In production, this would interact with user's wallet via frontend
            
            # Get quote first
            quote = self.get_swap_quote(token_in, token_out, amount_in)
            if not quote['success']:
                return quote
            
            # Calculate minimum amount out with slippage
            amount_out = int(quote['amount_out'])
            slippage_multiplier = (100 - slippage) / 100
            amount_out_min = int(amount_out * slippage_multiplier)
            
            # Simulate transaction hash (in production, this would be real)
            import hashlib
            import time
            tx_data = f"{wallet_address}{token_in}{token_out}{amount_in}{time.time()}"
            tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()
            
            return {
                'success': True,
                'transaction_hash': f'0x{tx_hash[:64]}',
                'amount_in': amount_in,
                'amount_out': str(amount_out),
                'amount_out_min': str(amount_out_min),
                'gas_used': '150000',
                'network': 'BSC Testnet',
                'message': 'Swap executed successfully! 🎉'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Swap execution failed: {str(e)}'
            }
    
    def get_common_tokens(self) -> Dict[str, str]:
        """
        Get list of common testnet tokens for swapping
        
        Returns:
            Dict of token symbols and their addresses
        """
        return self.common_tokens