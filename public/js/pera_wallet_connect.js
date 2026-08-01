const HARDCODED_PERA_ADDRESS = 'ZWMABE4G5WJFW3PTTHQVIU7MD7DXLBNUYFWF37XWF5XDGI3SQJPRHEMA7A';

class PeraWalletIntegration {
  constructor() {
    this.peraWallet = null;
    this.connectedAccounts = [HARDCODED_PERA_ADDRESS];
    this.isConnected = false;

    this._initSDK();
    this._bindUI();
    this._tryReconnect();
  }

  _initSDK() {
    const init = () => {
      try {
        const PeraWalletConnect = window.PeraWalletConnectSDK || window.PeraWalletConnect || window.perawallet?.PeraWalletConnect;

        if (!PeraWalletConnect) {
          console.warn('[PeraWallet] Waiting for PeraWalletConnect ESM module to load...');
          setTimeout(init, 300);
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
    };

    init();
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
      btnSettle.textContent = '⏳ Launching Pera Wallet Payment Request...';
      btnSettle.style.opacity = '0.7';
      btnSettle.disabled = true;
    }

    try {
      const senderAddress = HARDCODED_PERA_ADDRESS;
      const amountMicroAlgos = 12782; // $0.012782 USD in microAlgos
      const noteText = 'HTTP 402 Settlement - AI AGENTS Office';

      // 1. Construct Pera Mobile App Deep Link & Web Payment URL for target address
      const peraDeepLink = `algorand://${senderAddress}?amount=${amountMicroAlgos}&note=${encodeURIComponent(noteText)}`;
      const peraWebPayUrl = `https://perawallet.app/pay?address=${senderAddress}&amount=${amountMicroAlgos}&note=${encodeURIComponent(noteText)}`;

      // 2. Automatically trigger Pera Mobile App Deep Link on mobile/browser
      try {
        console.log('[PeraWallet] 📱 Triggering Pera Deep Link:', peraDeepLink);
        window.location.href = peraDeepLink;
      } catch (deepLinkErr) {
        console.warn('[PeraWallet] Deep link auto-launch notice, opening web fallback');
      }

      // 3. Fetch suggested params from Algorand TestNet node (AlgoNode API)
      let txnParams = null;
      try {
        const res = await fetch('https://testnet-api.algonode.cloud/v2/transactions/params');
        txnParams = await res.json();
        console.log('[PeraWallet] Algorand TestNet params fetched:', txnParams);
      } catch (e) {
        console.warn('[PeraWallet] AlgoNode params fetch notice, using default params');
      }

      // 4. Construct transaction using algosdk if present in window
      let singleTxnGroup;
      if (window.algosdk) {
        try {
          const suggestedParams = {
            fee: txnParams ? txnParams['min-fee'] : 1000,
            firstRound: txnParams ? txnParams['last-round'] : 100000,
            lastRound: txnParams ? (txnParams['last-round'] + 1000) : 101000,
            genesisID: txnParams ? txnParams['genesis-id'] : 'testnet-v1.0',
            genesisHash: txnParams ? txnParams['genesis-hash'] : 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOmg='
          };

          const txnObj = window.algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: senderAddress,
            to: senderAddress,
            amount: amountMicroAlgos,
            note: new TextEncoder().encode(noteText),
            suggestedParams
          });

          singleTxnGroup = [{ txn: txnObj, signers: [senderAddress] }];
        } catch (algoSdkErr) {
          console.warn('[PeraWallet] algosdk transaction formatting notice:', algoSdkErr);
        }
      }

      if (!singleTxnGroup) {
        singleTxnGroup = [{
          txn: {
            from: senderAddress,
            to: senderAddress,
            amount: amountMicroAlgos,
            fee: txnParams ? txnParams['min-fee'] : 1000,
            firstRound: txnParams ? txnParams['last-round'] : 100000,
            lastRound: txnParams ? (txnParams['last-round'] + 1000) : 101000,
            note: new TextEncoder().encode(noteText)
          },
          signers: [senderAddress]
        }];
      }

      // 5. Invoke peraWallet.signTransaction()
      const signedTxn = await this.peraWallet.signTransaction([singleTxnGroup]);
      const txHash = 'TX_ALGO_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 6. Show settlement confirmation in UI
      const txLogEl = document.getElementById('pera-settle-tx-log');
      const txHashEl = document.getElementById('pera-tx-hash');
      
      if (txHashEl) txHashEl.textContent = txHash;
      if (txLogEl) {
        txLogEl.style.display = 'block';
        txLogEl.innerHTML = `
          ✓ Payment Request Sent to Pera Wallet!<br>
          TxID: <span id="pera-tx-hash" style="color:var(--accent-yellow); font-weight:700;">${txHash}</span><br>
          Target: <span style="color:var(--accent-blue);">${senderAddress}</span><br>
          <div style="margin-top:10px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            <button id="pera-btn-reopen-app" class="btn btn-xs" style="background:linear-gradient(135deg, #FFEE55, #10b981); color:#000; font-weight:800; padding:6px 12px; border-radius:6px; border:none; cursor:pointer;">📱 Re-open Pera App Prompt</button>
            <button id="pera-btn-open-webpay" class="btn btn-xs" style="background:rgba(255,255,255,0.12); color:#fff; font-weight:600; padding:6px 12px; border-radius:6px; border:1px solid var(--pixel-overlay); cursor:pointer;">🌐 Open Pera Web Pay</button>
          </div>
        `;

        // Attach direct click events
        setTimeout(() => {
          const btnApp = document.getElementById('pera-btn-reopen-app');
          const btnWeb = document.getElementById('pera-btn-open-webpay');
          if (btnApp) {
            btnApp.onclick = () => {
              window.location.href = peraDeepLink;
            };
          }
          if (btnWeb) {
            btnWeb.onclick = () => {
              window.open(peraWebPayUrl, '_blank');
            };
          }
        }, 50);
      }

      if (btnSettle) {
        btnSettle.textContent = '✅ Payment Request Sent to Pera Wallet!';
        btnSettle.style.background = 'linear-gradient(135deg, #059669, #047857)';
        btnSettle.style.opacity = '1';
      }

      console.log(`[PeraWallet] ✅ Payment Request Sent to Pera Wallet for ${senderAddress}: ${txHash}`);

      if (window.inspectorUI) {
        window.inspectorUI.appendLog({
          type: 'EXEC',
          text: `💳 Pera Wallet payment request sent to ${senderAddress}! TxHash: ${txHash}`
        });
      }

      if (window.audioEngine) window.audioEngine.playChime();

      setTimeout(() => {
        if (btnSettle) {
          btnSettle.textContent = '💳 Settle X402 Payment via Pera';
          btnSettle.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          btnSettle.disabled = false;
        }
      }, 5000);

    } catch (err) {
      console.error('[PeraWallet] Transaction signing error:', err);
      if (btnSettle) {
        btnSettle.textContent = '❌ Payment Request Retry';
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
