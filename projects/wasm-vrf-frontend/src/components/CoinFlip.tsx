import { useState, useEffect } from "react";
import { HeadsOrTailsClient } from "../clients/HeadsOrTailsClient";
import VRF from "../webvrf";
import * as algokit from "@algorandfoundation/algokit-utils";

import { useWallet } from "@txnlab/use-wallet-react";
import { Coin } from "./Coin";

const APP_ID = import.meta.env.VITE_COIN_FLIP_APP_ID;
const BOX_STORAGE_COST = 31700;

export interface CoinFlipProps {
  algorand: algokit.AlgorandClient;
}

type CoinFlipGame = {
  commitmentRound: bigint;
  heads: boolean;
  pk: Uint8Array;
};

const getCoinFlipGame = async (appClient: HeadsOrTailsClient, address: string): Promise<CoinFlipGame | undefined> => {
  try {
    const r = await appClient.state.box.game.value(address);
    return r;
  } catch {
    // if no box exists, error will be thrown
  }
  return undefined;
};

export const CoinFlip = ({ algorand }: CoinFlipProps) => {
  const { algod } = algorand.client;

  const { transactionSigner, activeAddress } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // vrf keypair
  const [publicKey, setPublicKey] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [secretKey, setSecretKey] = useState<Uint8Array<ArrayBuffer> | null>(null);
  // game info
  const [commitmentRound, setCommitmentRound] = useState<bigint | null>(null);
  const [gameResult, setGameResult] = useState<boolean | null>(null);

  // client
  const [appClient, setAppClient] = useState<HeadsOrTailsClient | null>(null);

  const createGame = async () => {
    if (!appClient) {
      setError("app client not connected");
      return;
    }

    if (commitmentRound !== null) {
      setError("game already in progress");
      return;
    }

    if (!publicKey) {
      setError("public key not yet defined");
      return;
    }

    setGameResult(null);
    setError(null);
    setIsLoading(true);

    try {
      const boxFeeTxn = algorand.createTransaction.payment({
        sender: activeAddress!,
        receiver: appClient.appAddress,
        amount: algokit.microAlgos(BOX_STORAGE_COST),
      });

      const r = await appClient.send.createGame({
        args: { pk: publicKey, heads: true, boxFeeTxn },
      });

      setCommitmentRound(r.return!);
    } catch (error) {
      setError("Failed to create game error: " + String(error));
    }

    setIsLoading(false);
  };

  const completeGame = async () => {
    if (!appClient) {
      setError("app client not connected");
      return;
    }

    if (commitmentRound === null) {
      setError("no game in progress");
      return;
    }

    setIsLoading(true);

    try {
      // wait for block to become available
      const { lastRound } = await algod.statusAfterBlock(commitmentRound).do();

      // must be available
      if (lastRound < commitmentRound) {
        throw Error("commitment round is not yet available. please wait...");
      }

      // get the block
      const { block } = await algod.block(commitmentRound).do();

      // get block seed
      const { seed: blockSeed } = block.header;

      // create proof
      const { proof, result } = VRF.prove(secretKey, blockSeed);
      if (result !== 0) {
        throw Error("proof generation failed");
      }

      const r = await appClient.send.completeGame({
        args: { proof },
        extraFee: algokit.microAlgos(9000), // vrf_verify + paytxn (returning box fee)
        maxFee: algokit.microAlgos(10000), // cover app call
      });

      setGameResult(r?.return as boolean);
      setCommitmentRound(null);
    } catch (error) {
      setError(String(error));
    }

    setIsLoading(false);
  };

  const cancelGame = async () => {
    if (!appClient) {
      setError("app client not connected");
      return;
    }

    if (!commitmentRound) {
      setError("Must have a game in progress");
      return;
    }

    setIsLoading(true);

    try {
      const { lastRound } = await algod.status().do();

      if (commitmentRound >= lastRound - 1002n) {
        throw Error("cancel window has not yet elapsed, you should complete the game");
      }

      await appClient.send.cancelGame({
        args: {},
        staticFee: algokit.microAlgos(2000),
      });

      setCommitmentRound(null);
    } catch (error) {
      setError("Failed to cancel game error: " + String(error));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);

    const doit = async () => {
      try {
        await VRF.init();

        const { publicKey, secretKey, result } = VRF.keypair();
        if (result !== 0) {
          setError("Key generation failed");
          return;
        }

        setPublicKey(publicKey);
        setSecretKey(secretKey);

        const appClient = new HeadsOrTailsClient({
          appId: BigInt(APP_ID),
          defaultSigner: transactionSigner,
          defaultSender: activeAddress!,
          algorand: algorand,
        });

        // does the user have a game in progress?
        const cfg = await getCoinFlipGame(appClient, activeAddress!);

        if (cfg) {
          setCommitmentRound(cfg.commitmentRound);
        }

        setAppClient(appClient);
      } catch (error) {
        setError("Error initializing VRF:" + error);
      }

      setIsLoading(false);
    };

    if (activeAddress) {
      doit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAddress, algorand]);

  return (
    <div className="card container">
      <header className="card-header">
        <p className="card-header-title">Coin Flip (AppID: {APP_ID})</p>
      </header>

      <div className={`card-content ${isLoading ? "is-skeleton" : ""}`}>
        {publicKey && secretKey && (
          <>
            <label className="label">Public Key</label>
            <textarea className="textarea" value={btoa(publicKey.toString())} disabled></textarea>
            <label className="label">Private Key</label>
            <textarea className="textarea" value={btoa(secretKey.toString())} disabled></textarea>
          </>
        )}
        <div className="container" style={{ padding: "5px" }}>
          <Coin headsImg="heads.jpg" tailsImg="tails.jpg" result={gameResult ? "heads" : gameResult === false ? "tails" : undefined} />
        </div>

        <div style={{ display: "block-inline" }}>
          {commitmentRound && (
            <div>
              <p>Commitment Round: {commitmentRound}</p>
              <p>You bet: HEADS</p>
            </div>
          )}
          <div className="is-flex is-flex-direction-column" style={{ gap: "5px" }}>
            <button className="button is-primary" onClick={createGame} disabled={isLoading || commitmentRound !== null}>
              Create Commitment
            </button>

            <button className="button is-primary" onClick={completeGame} disabled={isLoading || commitmentRound === null}>
              Complete Game
            </button>

            <button className="button is-primary" onClick={cancelGame} disabled={isLoading || commitmentRound === null}>
              Cancel Game
            </button>
          </div>

          {gameResult !== null && <p style={{ fontWeight: "bold" }}>You {gameResult ? "won" : "lost"}</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};
