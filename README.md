SimpleDex
SimpleDex is a decentralized exchange (DEX) designed for seamless and secure token swaps on the Ethereum network. It combines robust smart contract functionality with an intuitive, modern interface to provide a user-friendly DeFi experience.

🚀 Features
Secure Wallet Integration: Connect easily with MetaMask.
Intuitive Interface: Simple and efficient token swapping.
Token Support: Includes popular tokens like ETH, DAI, and USDC.
Testnet Ready: Fully integrated with the Sepolia testnet for testing and development.
Real-Time Updates: Dynamic price fetching for accurate trading.
Gas Optimization: Efficient transactions to minimize costs.
🛠 Tech Stack
Frontend
Next.js: Fast and scalable React framework.
Chakra UI: Beautiful, accessible component library.
ethers.js: Simplifies Ethereum blockchain interactions.
Web3Modal: Hassle-free wallet connections.
Smart Contracts
Solidity: The language of Ethereum smart contracts.
Hardhat: Comprehensive Ethereum development environment.
OpenZeppelin: Trusted smart contract libraries and standards.
Etherscan: Verify and interact with deployed contracts.
📦 Installation
Clone the repository:

bash
Copy code
git clone https://github.com/FLucena/SimpleDex.git  
cd SimpleDex  
Install dependencies:

bash
Copy code
npm install  
Create a .env.local file in the root directory and add the following variables:


Copy code
SEPOLIA_RPC_URL=<Your_Sepolia_RPC_URL>  
PRIVATE_KEY=<Your_Private_Key>
ETHERSCAN_API_KEY=<Your_Etherscan_API_Key>

Start the development server:

bash
Copy code
npm run dev  
Open http://localhost:3000 in your browser to access the app.

🧑‍💻 Contributing
We welcome contributions! To get started:

Fork the repository.
Create a new branch for your feature or bug fix:
bash
Copy code
git checkout -b feature/your-feature-name  
Commit your changes:
bash
Copy code
git commit -m "Add your message here"  
Push to your branch:
bash
Copy code
git push origin feature/your-feature-name  
Submit a pull request.
📄 License
This project is licensed under the MIT License. See the LICENSE file for more details.