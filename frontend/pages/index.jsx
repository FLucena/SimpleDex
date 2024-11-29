import { ChakraProvider } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import SwapInterface from "../components/SwapInterface";

export default function Home() {
  return (
    <ChakraProvider>
      <Navbar />
      <SwapInterface />
    </ChakraProvider>
  );
} 