#!/usr/bin/env python3
"""
Token Quest Backend - Main Flask Application

A lightweight Flask backend that provides Web3 integration for token swaps
on BSC testnet using PancakeSwap V2 router.

Features:
- Wallet connection validation
- Token swap execution via PancakeSwap
- CORS enabled for frontend integration
- Minimal endpoints for lightweight deployment
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from swap_service import SwapService
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS for frontend integration
cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
CORS(app, origins=[cors_origin])

# Initialize swap service
swap_service = SwapService()

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify backend is running
    
    Returns:
        dict: Status and version information
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Token Quest Backend',
        'version': '1.0.0',
        'network': 'BSC Testnet'
    })

@app.route('/api/validate-wallet', methods=['POST'])
def validate_wallet():
    """
    Validate wallet address format and connection
    
    Expected JSON payload:
    {
        "address": "0x..."
    }
    
    Returns:
        dict: Validation result and wallet info
    """
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address:
            return jsonify({
                'success': False,
                'error': 'Wallet address is required'
            }), 400
        
        # Validate address format and get balance
        result = swap_service.validate_wallet(address)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Wallet validation failed: {str(e)}'
        }), 500

@app.route('/api/get-quote', methods=['POST'])
def get_swap_quote():
    """
    Get quote for token swap using PancakeSwap router
    
    Expected JSON payload:
    {
        "tokenIn": "0x...",
        "tokenOut": "0x...",
        "amountIn": "1000000000000000000"  // Wei amount
    }
    
    Returns:
        dict: Quote information including expected output
    """
    try:
        data = request.get_json()
        token_in = data.get('tokenIn')
        token_out = data.get('tokenOut')
        amount_in = data.get('amountIn')
        
        if not all([token_in, token_out, amount_in]):
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: tokenIn, tokenOut, amountIn'
            }), 400
        
        # Get swap quote from PancakeSwap
        quote = swap_service.get_swap_quote(token_in, token_out, amount_in)
        
        return jsonify(quote)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Quote calculation failed: {str(e)}'
        }), 500

@app.route('/api/execute-swap', methods=['POST'])
def execute_swap():
    """
    Execute token swap transaction
    
    Expected JSON payload:
    {
        "walletAddress": "0x...",
        "tokenIn": "0x...",
        "tokenOut": "0x...",
        "amountIn": "1000000000000000000",
        "slippage": 0.5  // Percentage
    }
    
    Returns:
        dict: Transaction result and XP earned
    """
    try:
        data = request.get_json()
        wallet_address = data.get('walletAddress')
        token_in = data.get('tokenIn')
        token_out = data.get('tokenOut')
        amount_in = data.get('amountIn')
        slippage = data.get('slippage', 0.5)
        
        if not all([wallet_address, token_in, token_out, amount_in]):
            return jsonify({
                'success': False,
                'error': 'Missing required parameters'
            }), 400
        
        # Execute the swap
        result = swap_service.execute_swap(
            wallet_address=wallet_address,
            token_in=token_in,
            token_out=token_out,
            amount_in=amount_in,
            slippage=slippage
        )
        
        # Calculate XP reward based on swap value
        if result['success']:
            # Base XP: 10, Bonus based on amount
            base_xp = 10
            amount_bonus = min(int(float(amount_in)) // 10**18, 50)  # Max 50 bonus
            total_xp = base_xp + amount_bonus
            
            result['xp_earned'] = total_xp
            result['message'] = f"🎉 Congratulations! You found a treasure worth {total_xp} XP!"
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Swap execution failed: {str(e)}'
        }), 500

@app.route('/api/token-info', methods=['POST'])
def get_token_info():
    """
    Get information about a specific token
    
    Expected JSON payload:
    {
        "tokenAddress": "0x..."
    }
    
    Returns:
        dict: Token information (symbol, decimals, name)
    """
    try:
        data = request.get_json()
        token_address = data.get('tokenAddress')
        
        if not token_address:
            return jsonify({
                'success': False,
                'error': 'Token address is required'
            }), 400
        
        # Get token information
        token_info = swap_service.get_token_info(token_address)
        
        return jsonify(token_info)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get token info: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Development server configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🚀 Token Quest Backend starting on port {port}")
    print(f"🌐 Network: BSC Testnet")
    print(f"🎮 Ready for treasure hunting!")
    
    app.run(host='0.0.0.0', port=port, debug=debug)