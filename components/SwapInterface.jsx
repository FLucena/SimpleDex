import {
  Box,
  VStack,
  Button,
  Select,
  Input,
  Text,
  useToast
} from "@chakra-ui/react";
import { useState } from "react";

const SwapInterface = () => {
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const toast = useToast();

  const handleFromTokenChange = (e) => {
    const selected = e.target.value;
    setFromToken(selected);
    setToToken(selected === "tokenA" ? "tokenB" : "tokenA");
  };

  const handleSwap = async () => {
    try {
      // Implement swap logic here
      toast({
        title: "Swap Initiated",
        description: "Your swap is being processed...",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      maxW="400px"
      mx="auto"
      mt={8}
      p={6}
      borderRadius="lg"
      boxShadow="xl"
      bg="white"
    >
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Swap Tokens
        </Text>
        
        <Select
          placeholder="Select token to swap from"
          value={fromToken}
          onChange={handleFromTokenChange}
        >
          <option value="tokenA">Token A</option>
          <option value="tokenB">Token B</option>
        </Select>

        <Input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />

        <Select
          placeholder="Select token to swap to"
          value={toToken}
          isDisabled={true}
        >
          <option value="tokenA">Token A</option>
          <option value="tokenB">Token B</option>
        </Select>

        <Button
          colorScheme="blue"
          width="100%"
          onClick={handleSwap}
          isDisabled={!fromToken || !toToken || !amount}
        >
          Swap
        </Button>
      </VStack>
    </Box>
  );
};

export default SwapInterface; 