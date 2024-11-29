import { Box, Flex, Button, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Navbar() {
  const [account, setAccount] = useState("");
  
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address.slice(0, 6) + "..." + address.slice(-4));
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    }
  };

  return (
    <Flex bg="gray.800" p={4} justify="space-between" align="center">
      <Text fontSize="xl" color="white">SimpleDex</Text>
      <Button 
        colorScheme="blue" 
        onClick={connectWallet}
      >
        {account || "Connect Wallet"}
      </Button>
    </Flex>
  );
} 