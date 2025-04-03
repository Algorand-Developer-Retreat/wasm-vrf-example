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
      <WalletMenu />
      <CoinFlip algorand={algorandClient} />
    </WalletProvider>
  );
}

export default App;
