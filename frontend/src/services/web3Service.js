import { BrowserProvider, parseEther, formatEther, Contract } from 'ethers';

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = '0xaa36a7';
export const ESCROW_CONTRACT_ADDRESS = "0x35B9A4753F81c4DeA96bDeFF3A44FDe5E6D4B752";

export const FAUCETS = [
  { name: "Google Cloud Web3 Sepolia Faucet", url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia" },
  { name: "Alchemy Sepolia PoW Faucet", url: "https://sepoliafaucet.com/" },
  { name: "QuickNode Sepolia Faucet", url: "https://faucet.quicknode.com/ethereum/sepolia" }
];

export class Web3Service {
  static isMetaMaskInstalled() {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  static async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error("MetaMask not detected! Please install the MetaMask browser extension to use cryptocurrency payments.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();
    const signer = await provider.getSigner();
    const balance = await provider.getBalance(accounts[0]);

    return {
      provider,
      signer,
      address: accounts[0],
      chainId: Number(network.chainId),
      isSepolia: Number(network.chainId) === SEPOLIA_CHAIN_ID,
      balanceEth: parseFloat(formatEther(balance)).toFixed(4)
    };
  }

  static async switchToSepolia() {
    if (!this.isMetaMaskInstalled()) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_HEX,
              chainName: 'Ethereum Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
        return true;
      }
      throw switchError;
    }
  }

  /**
   * Executes a Sepolia test transaction via MetaMask.
   * Sends payment to either the Escrow contract or merchant deposit address.
   */
  static async sendBookingPayment(amountEth, bookingId) {
    if (!this.isMetaMaskInstalled()) {
      // Fallback simulated payment for dev/testing when user doesn't have MetaMask extension
      console.warn("MetaMask not available; generating simulated Sepolia transaction hash.");
      return {
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        simulated: true,
        network: "Ethereum Sepolia"
      };
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    console.log(`[MetaMask] Initiating Sepolia transaction for Booking ID: ${bookingId}, Amount: ${amountEth} ETH`);

    try {
      // For real Sepolia testnet execution:
      // Send transaction to Escrow address with bookingId attached in data field
      const tx = await signer.sendTransaction({
        to: ESCROW_CONTRACT_ADDRESS,
        value: parseEther(amountEth.toString()),
        data: `0x${Buffer.from(bookingId).toString('hex')}`
      });

      console.log("[MetaMask] Sepolia Transaction Sent. Hash:", tx.hash);
      return {
        txHash: tx.hash,
        simulated: false,
        network: "Ethereum Sepolia (Testnet)"
      };
    } catch (err) {
      console.error("[MetaMask Payment Error]:", err);
      throw err;
    }
  }
}
