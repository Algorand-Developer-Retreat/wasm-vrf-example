# WASM VRF Example

An example of generating VRF proofs in a node.js environment using [WebAssembly (WASM)](https://en.wikipedia.org/wiki/WebAssembly) to run libsodium.

This is just a quick example, maybe someone finds it useful.

There is an app deployed on testnet ID: 736838866

`VITE_COIN_FLIP_APP_ID=736838866 npm run dev`

## Motivation

Currently the [randomness beacon](https://github.com/appliedblockchain/algorand-randomness-beacon) is a source of random data. The design provides some limitations, creates a dependency on an external service and time constraints (which more time sensitive applications might want to avoid).

There should be some investigation into alternative methods for the benefit of the ecosystem.

## How it works

1.  Participant generates a new VRF keypair, ensuring they don't reveal the private key.
2.  Participant submits their public key to the app using the `createGame` function and a `commitmentRound` is returned.
3.  Once the `commitmentRound` has passed the participant will create VRF proof of the block seed.
4.  The participant will then call the `completeGame` function of the app, the app will verify the VRF proof has been signed with the previously committed public key and that the data is the block seed for the `commitmentRound`.
5.  The app determines the result of the coin flip using this output data, the user is then notified if they won through the return value of the prior app call.

## Project Structure

[projects/wasm-vrf-contracts](./projects/wasm-vrf-contracts/README.md) - Demo TEALScript contract that allows a user to predict the result of a coin flip.
[projects/wasm-vrf-frontend](./projects/wasm-vrf-frontend) - Demo React application that interacts with the contract

## TODO

- [ ] Smart contract tests
- [ ] Further documentation
- [ ] Fix smart contract code, it is lacking security and validation
- [ ] Make the UI not terrible on the React app 😭
- [ ] Port `appliedblockchain/libsodium` to run in node.js environments without DOM, not just web (with grzracz implementatio)

## Credits

[grzracz](https://github.com/grzracz) - created the initial WASM library which inspired and enabled this demo.
