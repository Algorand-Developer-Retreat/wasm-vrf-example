import { Contract } from '@algorandfoundation/tealscript';

// cost of the box storage (user must cover)
const BOX_STORAGE_COST: uint64 = 31700;
// this number has always been suggested
const MIN_ROUND_GAP: uint64 = 8;

type HeadsOrTailsGame = {
  pk: bytes32; // public key of the partipicant
  heads: boolean; // participants prediction
  commitmentRound: uint64; // agreed commitment round
};

export class HeadsOrTails extends Contract {
  // map of partipcant games
  game = BoxMap<Address, HeadsOrTailsGame>();

  /**
   *
   * Create a new HeadsOrTails game
   * @param boxFeeTxn PayTxn covering the mbr increase
   * @param pk public key of the generated vrf keypair
   * @param heads does user think the user will be heads?
   * @returns uint64 the commitmentRound when participant can complete the game
   *
   */
  createGame(boxFeeTxn: PayTxn, pk: bytes32, heads: boolean): uint64 {
    assert(!this.game(this.txn.sender).exists, 'must not have a game in progress');

    // validate box cost is covered
    verifyPayTxn(boxFeeTxn, {
      receiver: this.app.address,
      amount: {
        greaterThanEqualTo: BOX_STORAGE_COST, // must at least cover the mbr increase
      },
    });

    const commitmentRound: uint64 = globals.round + MIN_ROUND_GAP;

    this.game(this.txn.sender).value = {
      pk: pk,
      heads: heads,
      commitmentRound: commitmentRound,
    };

    return commitmentRound;
  }

  /**
   *
   * Completes a game and refunds the user their box storage fees
   * @param proof the VRF proof signed by the participant's private key (using the block seed at commitmentRound)
   * @returns boolean if the user won or not
   *
   */
  public completeGame(proof: bytes<80>): boolean {
    const game: HeadsOrTailsGame = this.game(this.txn.sender).value;

    // get block seed
    const seed = blocks[game.commitmentRound].seed;

    // increase opcode budget, there should be 8+ calls as vrf_verify costs 5700
    while (globals.opcodeBudget < 5700) {
      increaseOpcodeBudget();
    }

    const r = vrfVefiry('VrfAlgorand', seed, proof, game.pk);

    assert(r.verified, 'the vrf must be verified');

    // check if first bit is set to determine result
    const resultIsHeads = getbit(r.output, 0);
    // had to explicity type these and ops to get it to compile correctly
    const won: boolean = ((resultIsHeads && game.heads) as boolean) || ((!resultIsHeads && !game.heads) as boolean);

    // send user back the box storage cost
    sendPayment({
      receiver: this.txn.sender,
      amount: BOX_STORAGE_COST,
      fee: 0,
      note: 'box storage cost refund',
    });

    // delete the game from storage
    this.game(this.txn.sender).delete();

    return won;
  }
}
