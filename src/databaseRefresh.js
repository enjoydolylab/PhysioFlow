// Refresh only catalog state; callers retain recording and selection state.
export async function fetchResearchCatalog(client) {
  const [me, researches] = await Promise.all([client.me(), client.researches()]);
  return { me, researches };
}
