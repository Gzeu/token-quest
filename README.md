# Token Quest 🏴‍☠️💰

A gamified crypto token swap platform that combines DeFi functionality with adventure game mechanics on BSC testnet.

## 🎮 Features

- **Wallet Connection**: Connect MetaMask or other Web3 wallets
- **Token Swapping**: Swap tokens using PancakeSwap testnet contracts on BSC
- **XP System**: Earn experience points for each successful swap
- **Adventure Theme**: Treasure hunt styled UI with congratulatory messages
- **Local Storage**: XP tracked locally (no backend database required)
- **Lightweight**: Minimal backend, ready for free hosting

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MetaMask wallet with BSC testnet configured
- BSC testnet BNB for gas fees

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gzeu/token-quest.git
   cd token-quest
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python app.py
   ```
   Backend will run on `http://localhost:5000`

3. **Setup Frontend**
   ```bash
   cd frontend
   # Open index.html in browser or use live server
   # Or use Python simple server:
   python -m http.server 3000
   ```
   Frontend will run on `http://localhost:3000`

### BSC Testnet Setup

1. **Add BSC Testnet to MetaMask**
   - Network Name: BSC Testnet
   - RPC URL: `https://data-seed-prebsc-1-s1.binance.org:8545/`
   - Chain ID: `97`
   - Symbol: `tBNB`
   - Block Explorer: `https://testnet.bscscan.com`

2. **Get Test Tokens**
   - Get tBNB: https://testnet.binance.org/faucet-smart
   - Get test tokens for swapping

## 🌐 Deployment

### Free Hosting Options

#### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### Replit
1. Import from GitHub
2. Configure environment variables
3. Run with `python backend/app.py`

#### GitHub Pages (Frontend only)
1. Enable GitHub Pages in repository settings
2. Deploy frontend as static site
3. Use external API for backend

### Environment Variables

Create `.env` file in backend directory:
```env
WEB3_PROVIDER_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PANCAKESWAP_ROUTER=0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3
PRIVATE_KEY=your_private_key_here
FLASK_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 🏗️ Project Structure

```
token-quest/
├── backend/
│   ├── app.py              # FastAPI/Flask main application
│   ├── swap_service.py     # Token swap logic with Web3
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/
│   ├── index.html         # Main UI page
│   ├── style.css          # Adventure-themed styling
│   ├── script.js          # Wallet connection & swap logic
│   └── assets/            # Images and icons
├── docs/
│   └── deployment.md      # Detailed deployment guide
└── README.md             # This file
```

## 🎯 How It Works

1. **Connect Wallet**: User connects MetaMask to BSC testnet
2. **Select Tokens**: Choose tokens to swap using PancakeSwap
3. **Execute Swap**: Confirm transaction in wallet
4. **Earn XP**: Receive experience points for successful swaps
5. **Level Up**: XP bar fills with congratulatory messages

## 🛠️ Technical Stack

- **Backend**: Flask/FastAPI + Web3.py
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Blockchain**: BSC Testnet + PancakeSwap V2
- **Styling**: Bootstrap 5 (minimal)
- **Storage**: Browser LocalStorage

## 🔧 Configuration

The platform uses PancakeSwap V2 testnet router:
- **Router Address**: `0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3`
- **Network**: BSC Testnet (Chain ID: 97)
- **Gas Token**: tBNB

## 🎮 Game Mechanics

- **Base XP**: 10 XP per successful swap
- **Bonus XP**: Larger swaps earn more XP
- **Levels**: Every 100 XP = 1 Level
- **Rewards**: Congratulatory messages and visual effects

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
- [PancakeSwap Testnet](https://pancake.kiemtienonline360.com/)
- [MetaMask Setup Guide](https://docs.binance.org/smart-chain/wallet/metamask.html)

---

**Happy Swapping! 🚀💎**