import * as algokit from "@algorandfoundation/algokit-utils";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { CoinFlip } from "./components/CoinFlip";

import { WalletManager, WalletId, NetworkId } from "@txnlab/use-wallet";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { WalletMenu } from "./components/UseWallet";

const manager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.LUTE],
  defaultNetwork: NetworkId.TESTNET, // or just 'mainnet'
});

const algorandClient = AlgorandClient.testNet();

algokit.Config.configure({
  // populate app call resources
  populateAppCallResources: true,
});

function App() {
  return (
    <WalletProvider manager={manager}>
      <section className="hero is-info">
        <div className="container">
          <h1 className="title">WASM VRF Demo</h1>
          <p className="subtitle">
            Verifable randomness <strong>without reliance</strong>!
          </p>
        </div>
      </section>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", margin: "5px" }}>
        <div style={{ marginTop: "5px", marginBottom: "5px" }}>
          <WalletMenu />
        </div>
        <CoinFlip algorand={algorandClient} />
      </div>
    </WalletProvider>
  );
}

export default App;
