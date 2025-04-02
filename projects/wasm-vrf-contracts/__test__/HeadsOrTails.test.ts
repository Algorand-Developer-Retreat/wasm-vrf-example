import { describe, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { Config } from '@algorandfoundation/algokit-utils';
import { HeadsOrTailsClient, HeadsOrTailsFactory } from '../contracts/clients/HeadsOrTailsClient';

const fixture = algorandFixture();
Config.configure({ populateAppCallResources: true });

let appClient: HeadsOrTailsClient;

describe('HeadsOrTails', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;
    const { algorand } = fixture;

    const factory = new HeadsOrTailsFactory({
      algorand,
      defaultSender: testAccount.addr,
    });

    const createResult = await factory.send.create.createApplication();
    appClient = createResult.appClient;
  });

  // test('createGame', async () => {
  // });

  // test('completeGame', async () => {
  // });
});
