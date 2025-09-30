/**
 * Token Quest - Frontend JavaScript
 * 
 * Handles Web3 wallet connection, token swaps, XP tracking, and UI interactions
 * for the Token Quest crypto treasure hunt platform.
 * 
 * Features:
 * - MetaMask wallet connection and validation
 * - PancakeSwap integration for token swaps
 * - Local XP tracking and level progression
 * - Adventure-themed UI feedback
 * - BSC Testnet configuration
 */

// Global variables and configuration
const CONFIG = {
    // BSC Testnet configuration
    CHAIN_ID: '0x61', // 97 in hex
    CHAIN_NAME: 'BSC Testnet',
    RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    BLOCK_EXPLORER: 'https://testnet.bscscan.com',
    CURRENCY: {
        name: 'tBNB',
        symbol: 'tBNB',
        decimals: 18
    },
    
    // PancakeSwap V2 Router (BSC Testnet)
    ROUTER_ADDRESS: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
    
    // Backend API configuration
    API_BASE_URL: 'http://localhost:5000',
    
    // Common testnet tokens
    TOKENS: {
        'WBNB': {
            address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
            symbol: 'WBNB',
            name: 'Wrapped BNB',
            decimals: 18
        },
        'BUSD': {
            address: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
            symbol: 'BUSD', 
            name: 'Binance USD',
            decimals: 18
        }
    }
};

// Application state
const AppState = {
    web3: null,
    account: null,
    isConnected: false,
    currentLevel: 1,
    currentXP: 0,
    questLog: []
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Token Quest initialized!');
    
    // Load saved state from localStorage
    loadSavedState();
    
    // Initialize UI
    initializeUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if wallet is already connected
    checkWalletConnection();
});

/**
 * Load saved XP and level data from localStorage
 */
function loadSavedState() {
    try {
        const savedXP = localStorage.getItem('tokenQuest_xp');
        const savedLevel = localStorage.getItem('tokenQuest_level');
        const savedQuestLog = localStorage.getItem('tokenQuest_questLog');
        
        if (savedXP) {
            AppState.currentXP = parseInt(savedXP);
        }
        
        if (savedLevel) {
            AppState.currentLevel = parseInt(savedLevel);
        }
        
        if (savedQuestLog) {
            AppState.questLog = JSON.parse(savedQuestLog);
        }
        
        console.log('📋 Loaded saved state:', {
            xp: AppState.currentXP,
            level: AppState.currentLevel,
            quests: AppState.questLog.length
        });
        
    } catch (error) {
        console.error('⚠️ Failed to load saved state:', error);
    }
}

/**
 * Save current XP and level data to localStorage
 */
function saveState() {
    try {
        localStorage.setItem('tokenQuest_xp', AppState.currentXP.toString());
        localStorage.setItem('tokenQuest_level', AppState.currentLevel.toString());
        localStorage.setItem('tokenQuest_questLog', JSON.stringify(AppState.questLog));
    } catch (error) {
        console.error('⚠️ Failed to save state:', error);
    }
}

/**
 * Initialize UI elements with current state
 */
function initializeUI() {
    updateXPDisplay();
    updateQuestLog();
    updateSwapButtonState();
}

/**
 * Set up all event listeners for UI interactions
 */
function setupEventListeners() {
    // Wallet connection button
    document.getElementById('connectWallet').addEventListener('click', handleWalletConnection);
    
    // Swap form submission
    document.getElementById('swapForm').addEventListener('submit', handleSwapSubmission);
    
    // Token selection changes
    document.getElementById('fromToken').addEventListener('change', handleTokenSelection);
    document.getElementById('toToken').addEventListener('change', handleTokenSelection);
    
    // Amount input changes
    document.getElementById('swapAmount').addEventListener('input', handleAmountChange);
    
    // Swap direction toggle
    document.getElementById('swapDirection').addEventListener('click', handleSwapDirection);
    
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

/**
 * Check if wallet is already connected on page load
 */
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet(accounts[0]);
            }
        } catch (error) {
            console.log('🔗 No wallet connected');
        }
    }
}

/**
 * Handle wallet connection button click
 */
async function handleWalletConnection() {
    if (AppState.isConnected) {
        // Disconnect wallet
        disconnectWallet();
    } else {
        // Connect wallet
        await requestWalletConnection();
    }
}

/**
 * Request wallet connection from MetaMask
 */
async function requestWalletConnection() {
    if (typeof window.ethereum === 'undefined') {
        alert('🥺 MetaMask is required to play Token Quest! Please install MetaMask to continue your adventure.');
        return;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            await connectWallet(accounts[0]);
        }
    } catch (error) {
        console.error('⚠️ Wallet connection failed:', error);
        showNotification('Failed to connect wallet. Please try again.', 'error');
    }
}

/**
 * Connect to wallet and initialize Web3
 */
async function connectWallet(account) {
    try {
        // Initialize Web3
        AppState.web3 = new Web3(window.ethereum);
        AppState.account = account;
        AppState.isConnected = true;
        
        console.log('🔗 Wallet connected:', account);
        
        // Verify network
        await verifyNetwork();
        
        // Update UI
        updateWalletUI();
        updateSwapButtonState();
        
        // Validate wallet with backend
        await validateWalletWithBackend(account);
        
        showNotification('🎉 Wallet connected! Ready to start your treasure hunt!', 'success');
        
    } catch (error) {
        console.error('⚠️ Wallet connection error:', error);
        showNotification('Wallet connection failed. Please try again.', 'error');
    }
}

/**
 * Disconnect wallet and reset state
 */
function disconnectWallet() {
    AppState.web3 = null;
    AppState.account = null;
    AppState.isConnected = false;
    
    updateWalletUI();
    updateSwapButtonState();
    
    console.log('🔗 Wallet disconnected');
    showNotification('Wallet disconnected', 'info');
}

/**
 * Verify that user is connected to BSC Testnet
 */
async function verifyNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== CONFIG.CHAIN_ID) {
            // Prompt user to switch to BSC Testnet
            await switchToBSCTestnet();
        } else {
            updateNetworkStatus(true);
        }
    } catch (error) {
        console.error('⚠️ Network verification failed:', error);
        updateNetworkStatus(false);
    }
}

/**
 * Switch to BSC Testnet network
 */
async function switchToBSCTestnet() {
    try {
        // Try to switch to BSC Testnet
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.CHAIN_ID }],
        });
        
        updateNetworkStatus(true);
        
    } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.CHAIN_ID,
                        chainName: CONFIG.CHAIN_NAME,
                        rpcUrls: [CONFIG.RPC_URL],
                        blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
                        nativeCurrency: CONFIG.CURRENCY
                    }],
                });
                
                updateNetworkStatus(true);
                
            } catch (addError) {
                console.error('⚠️ Failed to add BSC Testnet:', addError);
                updateNetworkStatus(false);
            }
        } else {
            console.error('⚠️ Failed to switch network:', switchError);
            updateNetworkStatus(false);
        }
    }
}

/**
 * Update network status in UI
 */
function updateNetworkStatus(isCorrectNetwork) {
    const networkStatus = document.getElementById('networkStatus');
    const networkInfo = document.getElementById('networkInfo');
    
    if (isCorrectNetwork) {
        networkStatus.className = 'alert alert-success';
        networkInfo.innerHTML = '<i class="fas fa-check-circle me-2"></i>Connected to BSC Testnet';
        networkStatus.classList.remove('d-none');
    } else {
        networkStatus.className = 'alert alert-warning';
        networkInfo.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Please switch to BSC Testnet';
        networkStatus.classList.remove('d-none');
    }
}

/**
 * Validate wallet with backend API
 */
async function validateWalletWithBackend(address) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/validate-wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Wallet validated:', result);
            // Update balance display if needed
        } else {
            console.error('⚠️ Wallet validation failed:', result.error);
        }
    } catch (error) {
        console.error('⚠️ Backend validation error:', error);
        // Continue without backend validation
    }
}

/**
 * Update wallet connection UI
 */
function updateWalletUI() {
    const connectButton = document.getElementById('connectWallet');
    
    if (AppState.isConnected && AppState.account) {
        const shortAddress = `${AppState.account.slice(0, 6)}...${AppState.account.slice(-4)}`;
        connectButton.innerHTML = `<i class="fas fa-wallet me-2"></i>${shortAddress}`;
        connectButton.classList.add('wallet-connected');
        connectButton.classList.remove('btn-warning');
    } else {
        connectButton.innerHTML = '<i class="fas fa-wallet me-2"></i>Connect Wallet';
        connectButton.classList.remove('wallet-connected');
        connectButton.classList.add('btn-warning');
    }
}

/**
 * Update XP display and progress bar
 */
function updateXPDisplay() {
    const xpForNextLevel = AppState.currentLevel * 100;
    const xpForCurrentLevel = (AppState.currentLevel - 1) * 100;
    const xpInCurrentLevel = AppState.currentXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - AppState.currentXP;
    
    document.getElementById('playerLevel').textContent = AppState.currentLevel;
    document.getElementById('currentXP').textContent = xpInCurrentLevel;
    document.getElementById('nextLevelXP').textContent = 100;
    
    const progressPercent = (xpInCurrentLevel / 100) * 100;
    document.getElementById('xpProgress').style.width = `${progressPercent}%`;
}

/**
 * Add XP and handle level progression
 */
function addXP(amount) {
    const oldLevel = AppState.currentLevel;
    AppState.currentXP += amount;
    
    // Check for level up
    const newLevel = Math.floor(AppState.currentXP / 100) + 1;
    
    if (newLevel > oldLevel) {
        AppState.currentLevel = newLevel;
        showLevelUpEffect();
    }
    
    updateXPDisplay();
    saveState();
    
    console.log(`🎆 Gained ${amount} XP! Total: ${AppState.currentXP} (Level ${AppState.currentLevel})`);
}

/**
 * Show level up visual effect
 */
function showLevelUpEffect() {
    // Add sparkle effect or other visual feedback
    showNotification(`🎆 Level Up! You are now level ${AppState.currentLevel}!`, 'success');
}

/**
 * Handle token selection changes
 */
function handleTokenSelection() {
    const fromToken = document.getElementById('fromToken').value;
    const toToken = document.getElementById('toToken').value;
    
    // Update token symbols in UI
    updateTokenSymbols();
    
    // Update expected output if amount is entered
    const amount = document.getElementById('swapAmount').value;
    if (amount && fromToken && toToken && fromToken !== toToken) {
        calculateExpectedOutput();
    }
    
    updateSwapButtonState();
}

/**
 * Update token symbols in UI elements
 */
function updateTokenSymbols() {
    const fromToken = document.getElementById('fromToken').value;
    const fromTokenSymbol = document.getElementById('fromTokenSymbol');
    
    if (fromToken && CONFIG.TOKENS[getTokenSymbolByAddress(fromToken)]) {
        fromTokenSymbol.textContent = CONFIG.TOKENS[getTokenSymbolByAddress(fromToken)].symbol;
    } else {
        fromTokenSymbol.textContent = 'TOKEN';
    }
}

/**
 * Get token symbol by address
 */
function getTokenSymbolByAddress(address) {
    for (const [symbol, token] of Object.entries(CONFIG.TOKENS)) {
        if (token.address.toLowerCase() === address.toLowerCase()) {
            return symbol;
        }
    }
    return null;
}

/**
 * Handle amount input changes
 */
function handleAmountChange() {
    const amount = document.getElementById('swapAmount').value;
    const fromToken = document.getElementById('fromToken').value;
    const toToken = document.getElementById('toToken').value;
    
    if (amount && fromToken && toToken && fromToken !== toToken) {
        calculateExpectedOutput();
    } else {
        document.getElementById('expectedOutput').textContent = '-- TOKEN';
    }
    
    updateSwapButtonState();
}

/**
 * Calculate expected output for swap
 */
async function calculateExpectedOutput() {
    const fromToken = document.getElementById('fromToken').value;
    const toToken = document.getElementById('toToken').value;
    const amount = document.getElementById('swapAmount').value;
    
    if (!amount || !fromToken || !toToken || fromToken === toToken) {
        return;
    }
    
    try {
        // Convert amount to wei
        const amountWei = AppState.web3.utils.toWei(amount.toString(), 'ether');
        
        // Get quote from backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/get-quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tokenIn: fromToken,
                tokenOut: toToken,
                amountIn: amountWei
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const outputAmount = AppState.web3.utils.fromWei(result.amount_out, 'ether');
            const toTokenSymbol = getTokenSymbolByAddress(toToken);
            
            document.getElementById('expectedOutput').textContent = 
                `${parseFloat(outputAmount).toFixed(6)} ${CONFIG.TOKENS[toTokenSymbol]?.symbol || 'TOKEN'}`;
            
            document.getElementById('priceImpact').textContent = `~${result.price_impact}%`;
        } else {
            document.getElementById('expectedOutput').textContent = 'Quote failed';
        }
        
    } catch (error) {
        console.error('⚠️ Quote calculation failed:', error);
        document.getElementById('expectedOutput').textContent = 'Quote unavailable';
    }
}

/**
 * Handle swap direction toggle
 */
function handleSwapDirection() {
    const fromToken = document.getElementById('fromToken');
    const toToken = document.getElementById('toToken');
    
    // Swap the values
    const tempValue = fromToken.value;
    fromToken.value = toToken.value;
    toToken.value = tempValue;
    
    // Update UI
    handleTokenSelection();
}

/**
 * Update swap button state based on form validation
 */
function updateSwapButtonState() {
    const swapButton = document.getElementById('swapButton');
    const swapButtonText = document.getElementById('swapButtonText');
    const fromToken = document.getElementById('fromToken').value;
    const toToken = document.getElementById('toToken').value;
    const amount = document.getElementById('swapAmount').value;
    
    if (!AppState.isConnected) {
        swapButton.disabled = true;
        swapButtonText.textContent = 'Connect Wallet to Start Quest';
    } else if (!fromToken || !toToken) {
        swapButton.disabled = true;
        swapButtonText.textContent = 'Select Tokens';
    } else if (fromToken === toToken) {
        swapButton.disabled = true;
        swapButtonText.textContent = 'Select Different Tokens';
    } else if (!amount || parseFloat(amount) <= 0) {
        swapButton.disabled = true;
        swapButtonText.textContent = 'Enter Amount';
    } else {
        swapButton.disabled = false;
        swapButtonText.textContent = 'Start Treasure Hunt!';
    }
}

/**
 * Handle swap form submission
 */
async function handleSwapSubmission(event) {
    event.preventDefault();
    
    if (!AppState.isConnected) {
        showNotification('Please connect your wallet first!', 'warning');
        return;
    }
    
    const formData = {
        fromToken: document.getElementById('fromToken').value,
        toToken: document.getElementById('toToken').value,
        amount: document.getElementById('swapAmount').value,
        slippage: document.getElementById('slippage').value
    };
    
    if (!formData.fromToken || !formData.toToken || !formData.amount) {
        showNotification('Please fill all required fields!', 'warning');
        return;
    }
    
    if (formData.fromToken === formData.toToken) {
        showNotification('Please select different tokens!', 'warning');
        return;
    }
    
    await executeSwap(formData);
}

/**
 * Execute the token swap
 */
async function executeSwap(formData) {
    const loadingState = document.getElementById('loadingState');
    const swapForm = document.getElementById('swapForm');
    
    try {
        // Show loading state
        swapForm.classList.add('d-none');
        loadingState.classList.remove('d-none');
        
        // Convert amount to wei
        const amountWei = AppState.web3.utils.toWei(formData.amount.toString(), 'ether');
        
        // Execute swap via backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/execute-swap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: AppState.account,
                tokenIn: formData.fromToken,
                tokenOut: formData.toToken,
                amountIn: amountWei,
                slippage: parseFloat(formData.slippage)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Swap successful!
            handleSwapSuccess(result, formData);
        } else {
            throw new Error(result.error || 'Swap failed');
        }
        
    } catch (error) {
        console.error('⚠️ Swap execution failed:', error);
        showNotification(`Swap failed: ${error.message}`, 'error');
    } finally {
        // Hide loading state
        loadingState.classList.add('d-none');
        swapForm.classList.remove('d-none');
    }
}

/**
 * Handle successful swap completion
 */
function handleSwapSuccess(result, formData) {
    // Award XP
    const xpEarned = result.xp_earned || 10;
    addXP(xpEarned);
    
    // Add to quest log
    addToQuestLog({
        type: 'swap',
        fromToken: getTokenSymbolByAddress(formData.fromToken),
        toToken: getTokenSymbolByAddress(formData.toToken),
        amount: formData.amount,
        xpEarned: xpEarned,
        timestamp: new Date().toISOString(),
        txHash: result.transaction_hash
    });
    
    // Show success modal
    showSuccessModal(result.message || 'Treasure found!', xpEarned);
    
    // Reset form
    document.getElementById('swapForm').reset();
    updateSwapButtonState();
    document.getElementById('expectedOutput').textContent = '-- TOKEN';
}

/**
 * Add entry to quest log
 */
function addToQuestLog(entry) {
    AppState.questLog.unshift(entry); // Add to beginning
    
    // Keep only last 10 entries
    if (AppState.questLog.length > 10) {
        AppState.questLog = AppState.questLog.slice(0, 10);
    }
    
    updateQuestLog();
    saveState();
}

/**
 * Update quest log display
 */
function updateQuestLog() {
    const questLogElement = document.getElementById('questLog');
    
    if (AppState.questLog.length === 0) {
        questLogElement.innerHTML = '<p class="text-muted text-center">No quests completed yet. Start your treasure hunt!</p>';
        return;
    }
    
    const questsHtml = AppState.questLog.map(quest => {
        const date = new Date(quest.timestamp).toLocaleString();
        const fromSymbol = CONFIG.TOKENS[quest.fromToken]?.symbol || quest.fromToken;
        const toSymbol = CONFIG.TOKENS[quest.toToken]?.symbol || quest.toToken;
        
        return `
            <div class="quest-entry">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <i class="fas fa-exchange-alt text-warning me-2"></i>
                        <strong>${quest.amount} ${fromSymbol} → ${toSymbol}</strong>
                    </div>
                    <span class="badge bg-warning text-dark">
                        +${quest.xpEarned} XP
                    </span>
                </div>
                <div class="small text-muted mt-1">
                    ${date}
                </div>
            </div>
        `;
    }).join('');
    
    questLogElement.innerHTML = questsHtml;
}

/**
 * Show success modal with treasure found message
 */
function showSuccessModal(message, xpEarned) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('earnedXP').textContent = xpEarned;
    
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Handle account changes from MetaMask
 */
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        connectWallet(accounts[0]);
    }
}

/**
 * Handle chain changes from MetaMask
 */
function handleChainChanged(chainId) {
    console.log('🔗 Chain changed to:', chainId);
    
    if (chainId === CONFIG.CHAIN_ID) {
        updateNetworkStatus(true);
    } else {
        updateNetworkStatus(false);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🎆 Token Quest frontend loaded successfully!');