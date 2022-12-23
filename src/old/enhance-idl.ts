export async function enhanceIdl(
  config: SolitaConfig,
  binaryVersion: string,
  libVersion: string,
) {
  if (isSolitaConfigAnchor(config)) {
    idl.metadata = {
      ...idl.metadata,
      address: config.programId,
      origin: config.idlGenerator,
      binaryVersion,
      libVersion,
    };
  } else if (isSolitaConfigShank(config)) {
    idl.metadata = {
      ...idl.metadata,
      binaryVersion,
      libVersion,
    };
  } else {
    // @ts-ignore
    throw new Error(`Unknown IDL generator ${config.idlGenerator}`);
  }
}
