import { BrowserProvider, parseEther, formatEther, hexlify, toUtf8Bytes, getAddress } from 'ethers';

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = '0xaa36a7';
// Sepolia test escrow / merchant deposit recipient (Normalized EIP-55 checksum)
export const ESCROW_CONTRACT_ADDRESS = getAddress("0x35b9a4753f81c4dea96bdeff3a44fde5e6d4b752");

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
      balanceEth: parseFloat(formatEther(balance)).toFixed(5)
    };
  }

  static async getBalance(address) {
    if (!this.isMetaMaskInstalled() || !address) return "0.00000";
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      return parseFloat(formatEther(balance)).toFixed(5);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      return "0.00000";
    }
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
   * Executes a real Sepolia transaction via MetaMask.
   * Sends payment to either the Escrow contract or merchant deposit address.
   */
  static async sendBookingPayment(amountEth, bookingId) {
    if (!this.isMetaMaskInstalled()) {
      console.warn("MetaMask not available; generating simulated Sepolia transaction hash.");
      return {
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        simulated: true,
        network: "Ethereum Sepolia"
      };
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const balance = await provider.getBalance(userAddress);

    const amountWei = parseEther(amountEth.toString());
    if (balance < amountWei) {
      throw new Error(`Insufficient Sepolia ETH! You have ${parseFloat(formatEther(balance)).toFixed(5)} ETH, but this booking requires ${amountEth} ETH. Claim free test ETH from the Faucet.`);
    }

    console.log(`[MetaMask] Prompting transaction: ${amountEth} ETH for Booking ID: ${bookingId}`);

    // Encode booking ID using ethers standard hexlify
    const hexData = hexlify(toUtf8Bytes(bookingId));

    // Send transaction to Escrow recipient
    const tx = await signer.sendTransaction({
      to: ESCROW_CONTRACT_ADDRESS,
      value: amountWei,
      data: hexData
    });

    console.log("[MetaMask] Sepolia Transaction broadcasted! Hash:", tx.hash);
    console.log("[MetaMask] Waiting for 1 block confirmation on Sepolia...");

    // Wait for block inclusion so the wallet balance updates on-chain!
    const receipt = await tx.wait(1);
    console.log("[MetaMask] Confirmed in block:", receipt.blockNumber);

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      simulated: false,
      network: "Ethereum Sepolia (Testnet)"
    };
  }
}
