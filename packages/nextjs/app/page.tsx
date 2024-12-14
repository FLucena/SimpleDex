"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { ContractWriteMethods } from "~~/app/debug/_components/contract/ContractWriteMethods";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { Contract } from "~~/utils/scaffold-eth/contract";

type SelectedToken = "A" | "B";

// Custom component to filter and display specific contract functions
const FilteredContractFunctions = ({
  deployedContractData,
  allowedFunctions,
}: {
  deployedContractData: Contract<"TokenA" | "TokenB" | "SimpleDEX">;
  allowedFunctions: string[];
}) => {
  // Create a filtered version of the contract data
  const filteredContractData = {
    ...deployedContractData,
    abi: deployedContractData.abi.filter(item => item.type === "function" && allowedFunctions.includes(item.name)),
  } as unknown as Contract<"TokenA" | "TokenB" | "SimpleDEX">;

  return (
    <div className="bg-base-100 rounded-xl shadow-md shadow-secondary border border-base-300">
      <div className="p-3 divide-y divide-base-300">
        <ContractWriteMethods
          deployedContractData={filteredContractData}
          onChange={() => {
            // Refresh data after contract write
            // This empty implementation is intentional as the component handles updates internally
          }}
        />
      </div>
    </div>
  );
};

export default function Home() {
  const { targetNetwork } = useTargetNetwork();
  const networkColor = useNetworkColor();
  const [selectedToken, setSelectedToken] = useState<SelectedToken>("A");
  const [selectedContract, setSelectedContract] = useState<"SimpleDEX" | "TokenA" | "TokenB">("SimpleDEX");

  // Get contract info
  const { data: deployedContractData, isLoading: isLoadingContract } = useDeployedContractInfo("SimpleDEX");
  const { data: tokenAContractData } = useDeployedContractInfo("TokenA");
  const { data: tokenBContractData } = useDeployedContractInfo("TokenB");

  // Read token addresses
  const { data: tokenAAddress } = useScaffoldReadContract({
    contractName: "SimpleDEX",
    functionName: "tokenA",
  });

  const { data: tokenBAddress } = useScaffoldReadContract({
    contractName: "SimpleDEX",
    functionName: "tokenB",
  });

  // Read price based on selected token
  const { data: price } = useScaffoldReadContract({
    contractName: "SimpleDEX",
    functionName: "getPrice",
    args: [selectedToken === "A" ? tokenAAddress : tokenBAddress],
  });

  const formatPrice = (priceInWei: bigint | undefined) => {
    if (!priceInWei) return "Loading...";
    const formattedPrice = Number(formatEther(priceInWei)).toFixed(4);
    return `${formattedPrice} ${selectedToken === "A" ? "TokenB/TokenA" : "TokenA/TokenB"}`;
  };

  const tokenFunctions = ["mint", "approve"];
  const dexFunctions = ["addLiquidity", "removeLiquidity", "swapAforB", "swapBforA"];

  if (isLoadingContract) return <div>Loading contracts...</div>;
  if (!deployedContractData || !tokenAContractData || !tokenBContractData) {
    return (
      <div className="text-center">
        <p>Contract not found! Please make sure:</p>
        <ul className="list-disc">
          <li>You&apos;re connected to the correct network ({targetNetwork.name})</li>
          <li>The contracts are deployed (run `yarn deploy`)</li>
          <li>The connected wallet has the correct permissions</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      {/* Fixed Left Sidebar */}
      <div className="w-[320px] fixed left-0 top-[67px] bottom-0 p-4 overflow-y-auto bg-[#0F172A]">
        <div className="flex flex-col gap-4">
          {/* Contract Addresses Header */}
          <div className="bg-[#1E293B] p-3 rounded-lg shadow-md border border-[#334155]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#94A3B8]">SimpleDEX:</span>
                <Address address={deployedContractData.address} size="xs" />
              </div>
              <div className="h-px bg-[#334155]" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#94A3B8]">Token A:</span>
                <Address address={tokenAAddress as string} size="xs" />
              </div>
              <div className="h-px bg-[#334155]" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#94A3B8]">Token B:</span>
                <Address address={tokenBAddress as string} size="xs" />
              </div>
              <div className="h-px bg-[#334155]" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#94A3B8]">Network:</span>
                <span className="text-xs" style={{ color: networkColor }}>
                  {targetNetwork.name}
                </span>
              </div>
            </div>
          </div>

          {/* Price Display Section */}
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
            <h2 className="text-lg font-bold mb-3 text-[#E2E8F0]">Current Price</h2>
            <div className="join mb-3 w-full">
              <button
                className={`btn btn-sm join-item flex-1 ${
                  selectedToken === "A"
                    ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[#3B82F6]"
                    : "bg-[#334155] hover:bg-[#475569] text-[#94A3B8] border-[#334155]"
                }`}
                onClick={() => setSelectedToken("A")}
              >
                Token A
              </button>
              <button
                className={`btn btn-sm join-item flex-1 ${
                  selectedToken === "B"
                    ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[#3B82F6]"
                    : "bg-[#334155] hover:bg-[#475569] text-[#94A3B8] border-[#334155]"
                }`}
                onClick={() => setSelectedToken("B")}
              >
                Token B
              </button>
            </div>
            <div className="px-4 py-3 rounded-xl bg-[#334155] border border-[#475569]">
              <p className="text-base font-bold text-[#E2E8F0]">{formatPrice(price)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[320px] p-4 mt-[67px]">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-col gap-4">
            {/* Contract Selection Buttons */}
            <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm flex-1 ${
                    selectedContract === "SimpleDEX"
                      ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[#3B82F6]"
                      : "bg-[#334155] hover:bg-[#475569] text-[#94A3B8] border-[#334155]"
                  }`}
                  onClick={() => setSelectedContract("SimpleDEX")}
                >
                  SimpleDEX
                </button>
                <button
                  className={`btn btn-sm flex-1 ${
                    selectedContract === "TokenA"
                      ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[#3B82F6]"
                      : "bg-[#334155] hover:bg-[#475569] text-[#94A3B8] border-[#334155]"
                  }`}
                  onClick={() => setSelectedContract("TokenA")}
                >
                  Token A
                </button>
                <button
                  className={`btn btn-sm flex-1 ${
                    selectedContract === "TokenB"
                      ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[#3B82F6]"
                      : "bg-[#334155] hover:bg-[#475569] text-[#94A3B8] border-[#334155]"
                  }`}
                  onClick={() => setSelectedContract("TokenB")}
                >
                  Token B
                </button>
              </div>
            </div>

            {/* Contract Functions */}
            <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155]">
              <h2 className="text-lg font-bold mb-3 text-[#E2E8F0]">
                {selectedContract === "SimpleDEX" ? "DEX Functions" : `${selectedContract} Functions`}
              </h2>
              {selectedContract === "SimpleDEX" && (
                <FilteredContractFunctions
                  deployedContractData={deployedContractData}
                  allowedFunctions={dexFunctions}
                />
              )}
              {selectedContract === "TokenA" && (
                <FilteredContractFunctions
                  deployedContractData={tokenAContractData}
                  allowedFunctions={tokenFunctions}
                />
              )}
              {selectedContract === "TokenB" && (
                <FilteredContractFunctions
                  deployedContractData={tokenBContractData}
                  allowedFunctions={tokenFunctions}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
