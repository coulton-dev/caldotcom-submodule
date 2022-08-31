import { ethers } from "ethers";
import { configureChains, createClient } from "wagmi";
import { z } from "zod";

import { createRouter } from "@calcom/trpc/server/createRouter";

import abi from "../utils/abi.json";
import { getProviders, SUPPORTED_CHAINS } from "../utils/ethereum";

const ethRouter = createRouter()
  // Fetch contract `name` and `symbol` or error
  .query("contract", {
    input: z.object({
      address: z.string(),
      chainId: z.number(),
    }),
    output: z.object({
      data: z
        .object({
          name: z.string(),
          symbol: z.string(),
        })
        .nullish(),
      error: z.string().nullish(),
    }),
    async resolve({ input: { address, chainId } }) {
      const { provider } = configureChains(
        SUPPORTED_CHAINS.filter((chain) => chain.id === chainId),
        getProviders()
      );

      const client = createClient({
        provider,
      });

      const contract = new ethers.Contract(address, abi, client.provider);

      try {
        const name = await contract.name();
        const symbol = await contract.symbol();

        return {
          data: {
            name,
            symbol,
          },
        };
      } catch (e) {
        return {
          error: "Could not find the contract data.",
        };
      }
    },
  })
  // Fetch user's `balance` of either ERC-20 or ERC-721 compliant token or error
  .query("balance", {
    input: z.object({
      address: z.string(),
      tokenAddress: z.string(),
      chainId: z.number(),
    }),
    output: z.object({
      data: z
        .object({
          hasBalance: z.boolean(),
        })
        .nullish(),
      error: z.string().nullish(),
    }),
    async resolve({ input: { address, tokenAddress, chainId } }) {
      const { provider } = configureChains(
        SUPPORTED_CHAINS.filter((chain) => chain.id === chainId),
        getProviders()
      );

      const client = createClient({
        provider,
      });

      const contract = new ethers.Contract(tokenAddress, abi, client.provider);

      try {
        const user = ethers.utils.getAddress(address);
        const balance = await contract.balanceOf(user);

        return {
          data: {
            hasBalance: !balance.isZero(),
          },
        };
      } catch (e) {
        console.log(e);
        return {
          error: "Could not fetch user's balance.",
        };
      }
    },
  });

export default ethRouter;
