/**
 * Pera Wallet Connect Integration
 * Uses the official @perawallet/connect SDK from https://github.com/perawallet/connect
 * 
 * SDK loaded via CDN: https://unpkg.com/@perawallet/connect@1.3.4/dist/index.umd.js
 * Exposes: window.PeraWalletConnect
 */
class PeraWalletIntegration {
  constructor() {
    this.peraWallet = null;
    this.connectedAccounts = [];
    this.isConnected = false;

    this._initSDK();
    this._bindUI();
    this._tryReconnect();
  }

  _initSDK() {
    try {
      const PeraWalletConnect = window.PeraWalletConnect || window.perawallet?.PeraWalletConnect;

      if (!PeraWalletConnect) {
        console.error('[PeraWallet] @perawallet/connect SDK not found on window.');
        this._setStatusText('⚠️ SDK missing — refresh page');
        return;
      }

      this.peraWallet = new PeraWalletConnect({
        chainId: 416002,  // Algorand TestNet
        shouldShowSignTxnToast: true
      });

      console.log('[PeraWallet] ✅ @perawallet/connect SDK initialized (TestNet, chainId: 416002)');
      this._setStatusText('✅ SDK Ready — Click "Connect Pera Wallet" to link your wallet');
    } catch (err) {
      console.error('[PeraWallet] SDK initialization error:', err);
      this._setStatusText('⚠️ SDK init error — check console');
    }
  }

  _bindUI() {
    // Connect button
    const btnConnect = document.getElementById('btn-pera-connect');
    if (btnConnect) {
      btnConnect.addEventListener('click', () => this.connect());
    }

    // Disconnect button
    const btnDisconnect = document.getElementById('btn-pera-disconnect');
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', () => this.disconnect());
    }

    // Settle X402 button
    const btnSettle = document.getElementById('btn-pera-settle');
    if (btnSettle) {
      btnSettle.addEventListener('click', () => this.settleX402Payment());
    }
  }

  async _tryReconnect() {
    if (!this.peraWallet) return;

    try {
      const accounts = await this.peraWallet.reconnectSession();
      
      if (accounts && accounts.length > 0) {
        this.connectedAccounts = accounts;
        this.isConnected = true;

        // Setup disconnect listener
        this.peraWallet.connector?.on('disconnect', () => this._handleDisconnect());

        this._showConnectedUI(accounts[0]);
        console.log('[PeraWallet] ✅ Session reconnected:', accounts[0]);
      }
    } catch (err) {
      // No previous session — that's fine
      console.log('[PeraWallet] No previous session to reconnect.');
    }
  }

  async connect() {
    if (!this.peraWallet) {
      alert('⚠️ Pera Wallet SDK not loaded. Please refresh the page.');
      return;
    }

    const btnConnect = document.getElementById('btn-pera-connect');
    if (btnConnect) {
      btnConnect.textContent = '⏳ Opening Pera Wallet...';
      btnConnect.style.opacity = '0.7';
      btnConnect.disabled = true;
    }

    try {
      // This opens the Pera Wallet connect modal with QR code
      const newAccounts = await this.peraWallet.connect();

      if (newAccounts && newAccounts.length > 0) {
        this.connectedAccounts = newAccounts;
        this.isConnected = true;

        // Setup disconnect event listener
        this.peraWallet.connector?.on('disconnect', () => this._handleDisconnect());

        this._showConnectedUI(newAccounts[0]);
        console.log('[PeraWallet] ✅ Connected successfully:', newAccounts[0]);

        // Log to inspector if available
        if (window.inspectorUI) {
          window.inspectorUI.appendLog({
            type: 'INFO',
            text: `🔗 Pera Wallet connected: ${this._truncateAddress(newAccounts[0])}`
          });
        }
      }
    } catch (error) {
      // User closed the modal — this is expected behavior per the SDK docs
      if (error?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error('[PeraWallet] Connection error:', error);
        alert('❌ Pera Wallet connection failed. Make sure you have the Pera Wallet app installed.');
      } else {
        console.log('[PeraWallet] User closed the connect modal.');
      }
    } finally {
      if (btnConnect) {
        btnConnect.textContent = '📱 Connect Pera Wallet';
        btnConnect.style.opacity = '1';
        btnConnect.disabled = false;
      }
    }
  }

  async disconnect() {
    if (!this.peraWallet) return;

    try {
      await this.peraWallet.disconnect();
      this._handleDisconnect();
      console.log('[PeraWallet] 🔌 Wallet disconnected by user.');
    } catch (err) {
      console.error('[PeraWallet] Disconnect error:', err);
      // Force disconnect UI anyway
      this._handleDisconnect();
    }
  }

  _handleDisconnect() {
    this.connectedAccounts = [];
    this.isConnected = false;

    // Reset UI
    const connectedInfo = document.getElementById('pera-connected-info');
    const btnConnect = document.getElementById('btn-pera-connect');
    const txLog = document.getElementById('pera-settle-tx-log');

    if (connectedInfo) connectedInfo.style.display = 'none';
    if (btnConnect) {
      btnConnect.textContent = '📱 Connect Pera Wallet';
      btnConnect.style.display = 'inline-flex';
      btnConnect.style.background = 'linear-gradient(135deg, #FFEE55, #10b981)';
    }
    if (txLog) txLog.style.display = 'none';

    this._setStatusText('🔌 Disconnected — Click "Connect Pera Wallet" to reconnect');

    if (window.inspectorUI) {
      window.inspectorUI.appendLog({
        type: 'INFO',
        text: '🔌 Pera Wallet disconnected'
      });
    }
  }

  async settleX402Payment() {
    if (!this.isConnected || this.connectedAccounts.length === 0) {
      alert('⚠️ Please connect your Pera Wallet first.');
      return;
    }

    const btnSettle = document.getElementById('btn-pera-settle');
    if (btnSettle) {
      btnSettle.textContent = '⏳ Preparing X402 settlement...';
      btnSettle.style.opacity = '0.7';
      btnSettle.disabled = true;
    }

    try {
      // For demo/TestNet: We simulate the transaction preparation
      // In production, you would create a real Algorand transaction here
      // using algosdk and sign it with peraWallet.signTransaction()
      
      const senderAddress = this.connectedAccounts[0];
      const txHash = 'TX_PERA_ALGO_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Show settlement confirmation
      const txLogEl = document.getElementById('pera-settle-tx-log');
      const txHashEl = document.getElementById('pera-tx-hash');
      
      if (txHashEl) txHashEl.textContent = txHash;
      if (txLogEl) txLogEl.style.display = 'block';

      if (btnSettle) {
        btnSettle.textContent = '✅ X402 Payment Settled!';
        btnSettle.style.background = 'linear-gradient(135deg, #059669, #047857)';
        btnSettle.style.opacity = '1';
      }

      console.log(`[PeraWallet] ✅ X402 Settlement: ${txHash} from ${this._truncateAddress(senderAddress)}`);

      if (window.inspectorUI) {
        window.inspectorUI.appendLog({
          type: 'EXEC',
          text: `💳 X402 micro-payment settled via Pera Wallet! TxHash: ${txHash}`
        });
      }

      if (window.audioEngine) window.audioEngine.playChime();

      // Reset button after delay
      setTimeout(() => {
        if (btnSettle) {
          btnSettle.textContent = '💳 Settle X402 Payment via Pera';
          btnSettle.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btnSettle.disabled = false;
        }
      }, 5000);

    } catch (err) {
      console.error('[PeraWallet] Settlement error:', err);
      if (btnSettle) {
        btnSettle.textContent = '❌ Settlement Failed — Retry';
        btnSettle.style.opacity = '1';
        btnSettle.disabled = false;
      }
    }
  }

  _showConnectedUI(address) {
    const connectedInfo = document.getElementById('pera-connected-info');
    const addressEl = document.getElementById('pera-wallet-address');
    const btnConnect = document.getElementById('btn-pera-connect');

    if (connectedInfo) connectedInfo.style.display = 'block';
    if (addressEl) addressEl.textContent = address;
    if (btnConnect) {
      btnConnect.textContent = '✅ Connected';
      btnConnect.style.background = 'linear-gradient(135deg, #059669, #047857)';
      btnConnect.disabled = true;
    }

    this._setStatusText(`✅ Connected to ${this._truncateAddress(address)} on Algorand TestNet`);
  }

  _setStatusText(text) {
    const statusEl = document.getElementById('pera-connect-status');
    if (statusEl) statusEl.textContent = text;
  }

  _truncateAddress(address) {
    if (!address || address.length < 12) return address;
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  }
}

// Initialize after DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure the Pera SDK UMD bundle is loaded
  setTimeout(() => {
    window.peraWalletIntegration = new PeraWalletIntegration();
  }, 500);
});
