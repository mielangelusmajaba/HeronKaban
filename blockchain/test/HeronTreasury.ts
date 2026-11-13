import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, parseUnits, toHex } from "viem";

const { viem } = await network.create();
const peso = (n: number) => parseUnits(String(n), 18);
const ref = (s: string) => keccak256(toHex(s));

describe("HeronTreasury", async () => {
  const [relayer, president, o1, o2, o3, outsider, payee] = await viem.getWalletClients();

  let token: Awaited<ReturnType<typeof viem.deployContract<"PesoToken">>>;
  let treasury: Awaited<ReturnType<typeof viem.deployContract<"HeronTreasury">>>;
  async function treasuryAs(w: typeof relayer) {
    return viem.getContractAt("HeronTreasury", treasury.address, { client: { wallet: w } });
  }

  /** Org 1: signers o1,o2,o3, threshold 2, funded with ₱10,000. */
  beforeEach(async () => {
    token = await viem.deployContract("PesoToken", [relayer.account.address]);
    treasury = await viem.deployContract("HeronTreasury", [token.address]);
    const t = await treasuryAs(president);
    await t.write.createOrg([[o1.account.address, o2.account.address, o3.account.address], 2]);
    await token.write.mint([relayer.account.address, peso(10_000)]);
    await token.write.approve([treasury.address, peso(10_000)]);
    await treasury.write.deposit([1n, peso(10_000), ref("member-1")]);
  });

  async function fileRequest(amount = 1200, receipt = "receipt-a") {
    const t = await treasuryAs(o1);
    await t.write.createRequest([1n, peso(amount), payee.account.address, 0n, ref(receipt)]);
    return (await treasury.read.requestCount()) as bigint;
  }

  it("tracks deposits per org", async () => {
    const [admin, threshold, balance, signers] = await treasury.read.getOrg([1n]);
    assert.equal(admin.toLowerCase(), president.account.address.toLowerCase());
    assert.equal(threshold, 2);
    assert.equal(balance, peso(10_000));
    assert.equal(signers.length, 3);
  });

  it("one approval never releases funds", async () => {
    const id = await fileRequest();
    await (await treasuryAs(o1)).write.approve([id]);
    const r = await treasury.read.getRequest([id]);
    assert.equal(r.status, 1); // Pending
    assert.equal(await token.read.balanceOf([payee.account.address]), 0n);
  });

  it("the same officer cannot approve twice", async () => {
    const id = await fileRequest();
    const t = await treasuryAs(o1);
    await t.write.approve([id]);
    await viem.assertions.revertWithCustomError(t.write.approve([id]), treasury, "AlreadyApproved");
  });

  it("two distinct approvals release exactly once", async () => {
    const id = await fileRequest(1200);
    await (await treasuryAs(o1)).write.approve([id]);
    await viem.assertions.emit((await treasuryAs(o2)).write.approve([id]), treasury, "Released");
    assert.equal(await token.read.balanceOf([payee.account.address]), peso(1200));
    const [, , balance] = await treasury.read.getOrg([1n]);
    assert.equal(balance, peso(8800));
    await viem.assertions.revertWithCustomError((await treasuryAs(o3)).write.approve([id]), treasury, "NotPending");
  });

  it("non-signers cannot file or approve", async () => {
    const id = await fileRequest();
    const t = await treasuryAs(outsider);
    await viem.assertions.revertWithCustomError(t.write.approve([id]), treasury, "NotSigner");
    await viem.assertions.revertWithCustomError(
      t.write.createRequest([1n, peso(1), payee.account.address, 0n, ref("x")]),
      treasury,
      "NotSigner",
    );
    // the President is the org admin, not automatically a signer
    await viem.assertions.revertWithCustomError((await treasuryAs(president)).write.approve([id]), treasury, "NotSigner");
  });

  it("rejects a reused receipt hash", async () => {
    await fileRequest(100, "same-receipt");
    await viem.assertions.revertWithCustomError(
      (await treasuryAs(o2)).write.createRequest([1n, peso(100), payee.account.address, 0n, ref("same-receipt")]),
      treasury,
      "ReceiptAlreadyUsed",
    );
  });

  it("reject and cancel move no funds", async () => {
    const a = await fileRequest(500, "r1");
    const b = await fileRequest(500, "r2");
    await (await treasuryAs(o3)).write.reject([a]);
    await viem.assertions.revertWithCustomError((await treasuryAs(o2)).write.cancel([b]), treasury, "NotRequester");
    await (await treasuryAs(o1)).write.cancel([b]);
    assert.equal((await treasury.read.getRequest([a])).status, 3);
    assert.equal((await treasury.read.getRequest([b])).status, 4);
    assert.equal(await token.read.balanceOf([payee.account.address]), 0n);
    await viem.assertions.revertWithCustomError((await treasuryAs(o2)).write.approve([a]), treasury, "NotPending");
  });

  it("requires at least 2 signers and threshold >= 2", async () => {
    const t = await treasuryAs(president);
    await viem.assertions.revertWithCustomError(t.write.createOrg([[o1.account.address], 1]), treasury, "BadSigners");
    await viem.assertions.revertWithCustomError(
      t.write.createOrg([[o1.account.address, o2.account.address], 1]),
      treasury,
      "BadThreshold",
    );
    await viem.assertions.revertWithCustomError(
      t.write.createOrg([[o1.account.address, o2.account.address], 3]),
      treasury,
      "BadThreshold",
    );
    await viem.assertions.revertWithCustomError(
      t.write.createOrg([[o1.account.address, o1.account.address], 2]),
      treasury,
      "BadSigners",
    );
  });

  it("only the org admin can change signers, and old approvals stop counting", async () => {
    const id = await fileRequest();
    await (await treasuryAs(o1)).write.approve([id]);
    await viem.assertions.revertWithCustomError(
      (await treasuryAs(o1)).write.setSigners([1n, [o1.account.address, o2.account.address], 2]),
      treasury,
      "NotOrgAdmin",
    );
    await (await treasuryAs(president)).write.setSigners([1n, [o2.account.address, o3.account.address], 2]);
    // o1 is no longer a signer
    await viem.assertions.revertWithCustomError((await treasuryAs(o1)).write.approve([id]), treasury, "NotSigner");
    // o1's earlier approval no longer counts: o2 alone does not release
    await (await treasuryAs(o2)).write.approve([id]);
    assert.equal((await treasury.read.getRequest([id])).status, 1);
    await (await treasuryAs(o3)).write.approve([id]);
    assert.equal((await treasury.read.getRequest([id])).status, 2);
  });

  it("refuses to release more than the org holds", async () => {
    const id = await fileRequest(20_000);
    await (await treasuryAs(o1)).write.approve([id]);
    await viem.assertions.revertWithCustomError((await treasuryAs(o2)).write.approve([id]), treasury, "InsufficientBalance");
  });

  it("enforces event budget caps", async () => {
    await (await treasuryAs(o1)).write.setEventBudget([1n, 7n, peso(1000)]);
    const t = await treasuryAs(o1);
    await t.write.createRequest([1n, peso(800), payee.account.address, 7n, ref("e1")]);
    await viem.assertions.revertWithCustomError(
      t.write.createRequest([1n, peso(300), payee.account.address, 7n, ref("e2")]),
      treasury,
      "OverEventBudget",
    );
  });
});
