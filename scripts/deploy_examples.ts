import net from "net";

import { ethers, JsonRpcProvider } from "ethers";

import { connect_kettle, deploy_artifact, deploy_artifact_direct, attach_artifact, kettle_advance, kettle_execute, derive_key } from "./common"

import * as LocalConfig from '../deployment.json'

async function deploy() {
  const kettle = connect_kettle(LocalConfig.KETTLE_RPC);

  const provider = new JsonRpcProvider(LocalConfig.RPC_URL);
  const wallet = new ethers.Wallet(LocalConfig.PRIVATE_KEY, provider);
  const ADDR_OVERRIDES: {[key: string]: string} = LocalConfig.ADDR_OVERRIDES;
  const KM = await attach_artifact(LocalConfig.KEY_MANAGER_SN_ARTIFACT, wallet, ADDR_OVERRIDES[LocalConfig.KEY_MANAGER_SN_ARTIFACT]);

  const SealedAuction = await deploy_artifact_direct(LocalConfig.SEALED_AUCTION_ARTIFACT, wallet, KM.target, 5);
  const [Timelock, foundTL] = await deploy_artifact(LocalConfig.TIMELOCK_ARTIFACT, wallet, KM.target);

  await kettle_advance(kettle);

  await derive_key(await SealedAuction.getAddress(), kettle, KM);
  if (!foundTL) {
    await derive_key(await Timelock.getAddress(), kettle, KM);
  }
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
