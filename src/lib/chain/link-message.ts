/** The exact text an officer signs to prove they own a wallet. Shared by client and server. */
export function walletLinkMessage(userId: string, address: string, issuedAt: string) {
  return [
    "HeronKaban: link this wallet to my account.",
    "This signature costs nothing and does not move any funds.",
    `Account: ${userId}`,
    `Wallet: ${address.toLowerCase()}`,
    `Issued: ${issuedAt}`,
  ].join("\n");
}
